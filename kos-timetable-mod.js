class TimetableMod
{
    /* static constants */
    static MONDAY = 0; static TUESDAY = 1; static WEDNESDAY = 2; static THURSDAY = 3; static FRIDAY = 4;
    static WEEKS_ALL = 0; static WEEKS_ODD = 1; static WEEKS_EVEN = 2;
    static LOCALE_CZ = "CZE"; static LOCALE_EN = "ENG";

    constructor(locale)
    {
        if(!locale)
        {
            console.error("Please specify locale in constructor parameter:\n" +
                          "new TimetableMod(TimetableMod.LOCALE_CZ) or new TimetableMod(TimetableMod.LOCALE_EN).");
            return {};
        }

        this.locale = locale;
        this.addedTickets = [];
        this.customStylesheet = document.createElement('style');
        document.head.appendChild(this.customStylesheet);
    }

    renameCourse(from, to)
    {
        document.querySelectorAll('.ticket-body > div:first-child').forEach((e) => { e.innerHTML = e.innerHTML.replace(from, to) });
    }

    hyphensToNdashes()
    {
        document.querySelectorAll('.ticket-header > .overflow-hidden').forEach((e) => { e.innerHTML = e.innerHTML.replace(' - ', '&ndash;') });
    }

    deleteTicket(ticket)
    {
        if(!this.addedTickets.includes(ticket))
            return false;
        ticket.parentNode.removeChild(ticket);
        this.addedTickets = this.addedTickets.filter((e) => {e != ticket});
        return true;
    }

    /**
     * Resizes the rows of the schedule to the numbers given in the parameter.
     * 
     * @param {Array<number>} heights array of (5) numbers specifying the relative height (1 = height of one ticket) of each row 
     * @returns whether or not the parameter is ok (doesn't check actual resizing success)
     */
    setRowHeights(heights)
    {
        if(heights.length != 5)
            return false; 
        /*for(let height of heights)
            if(typeof(height) != typeof(1))
                return false;*/

        // modify grid used to align the classes
        const grid = document.querySelector('.schedule-grid');
        let i = 0;
        grid.style = "grid-template-rows:"
            + " var(--low-row-height)" // this is the header
            + ` calc(var(--row-height) * ${heights[i++]})`
            + ` calc(var(--row-height) * ${heights[i++]})`
            + ` calc(var(--row-height) * ${heights[i++]})`
            + ` calc(var(--row-height) * ${heights[i++]})`
            + ` calc(var(--row-height) * ${heights[i++]})`
            + " var(--low-row-height);" // this is the last (empty) row
            + " --rows-count: 7; --columns-count: 17; --row-height: 5.25rem; --column-width: 5rem;";
        
        // resize the day markings on the left
        const dayLabels = document.querySelector('.schedule-grid > .schedule-days');
        i = 0;
        dayLabels.style = "grid-template-rows:"
            + ` calc(var(--row-height) * ${heights[i++]})`
            + ` calc(var(--row-height) * ${heights[i++]})`
            + ` calc(var(--row-height) * ${heights[i++]})`
            + ` calc(var(--row-height) * ${heights[i++]})`
            + ` calc(var(--row-height) * ${heights[i++]})`;

        // resize the visible grid
        for(const gridColumn of document.querySelector('.schedule-events-grid').children)
            for(i = 0; i < 5; i++)
                gridColumn.children[i].style = `height: calc(var(--row-height) * ${heights[i]});`;
        
        return true;
    };

    getRowHeights()
    {
        const grid = document.querySelector('.schedule-grid');
        let gridCss = grid.style.gridTemplateRows;
        
        // extracts the template for the 5 rows we are interested in
        gridCss = /var\(--low-row-height\) (.*?) var\(--low-row-height\).*/.exec(gridCss)[1];

        let rowHeights = [];
        while(gridCss)
        {
            console.log(gridCss);

            gridCss = gridCss.trim();
            if(gridCss.startsWith('var(--row-height)'))
            {
                rowHeights.push(1);
                gridCss = gridCss.substr('var(--row-height)'.length);
                continue;
            }

            rowHeights.push(parseInt(/^calc\(var\(--row-height\) ?\* ?([0-9]+)\)/.exec(gridCss)[1]));
            gridCss = /^calc\(var\(--row-height\) ?\* ?[0-9]+\) ?(.*)/.exec(gridCss)[1];
        }

        return rowHeights;
    }
    
    __addClassStyleInternal(className, borderColour, backgroundColour)
    {
        this.customStylesheet.sheet.insertRule(`.${className} { border-left: .25rem solid ${borderColour} !important; background-color: ${backgroundColour} !important; }`, 0);
        this.customStylesheet.sheet.insertRule(`.${className} .box.box-parallel.P, .${className} .box.box-parallel.C, .${className} .box.box-parallel.L { background-color: ${borderColour} !important; }`, 0);
    };

    /**
     * Note: if you don't want me to automatically generate colours based on a single hue,
     * feel free to use method __addClassStyleInternal(className, borderColour, backgroundColour).
     * 
     * @param {string} className css-compatible class name (unique if possible)
     * @param {number} colourHue colour (hue) to use for this class (0-360).
     */
    addClassStyle(className, colourHue)
    {
        const accent = `hsl(${colourHue}, 70%, 55%)`;
        const light = `hsl(${colourHue}, 100%, 95%)`;

        this.__addClassStyleInternal(className, accent, light);
    };

    /**
     * Given information about the ticket, cook up a style string that correctly places
     * the ticket element in the schedule grid.
     * 
     * @param {string} timeString string in the format "HH:MM - HH:MM"
     * @param {number} dayOfWeek integer (0-4) representing the day of the week
     * @param {number} offsetTop offset within row with non-standard height (useful for conflicting classes)
     * @param {Array<number>} rowHeights array containing the height multipliers of individual rows (see setRowHeights)
     * @returns the style string
     */
    __createStyleFromTimeInternal(timeString, dayOfWeek, offsetTop)
    {
        // check string format
        if(!/^[0-2]?[0-9]:[0-5][0-9] ?- ?[0-2]?[0-9]:[0-5][0-9]$/.test(timeString))
            return "";

        //rowHeights.forEach((value, index, array) => {if(index > 0) array[index] += array[index - 1];});
        const rowHeights = [1, 2, 3, 4, 5];
        const rowBaseHeight = Number.parseFloat(getComputedStyle(document.querySelector(".schedule-grid")).getPropertyValue('--row-height'));

        const startingHour = Number(/^[0-2]?[0-9]/.exec(timeString));
        const startingMinute = Number(/^[0-2]?[0-9]:([0-5][0-9])/.exec(timeString)[1]);
        const endingHour = Number(/^[0-2]?[0-9]:[0-5][0-9] ?- ?([0-2]?[0-9])/.exec(timeString)[1]);
        const endingMinute = Number(/^[0-2]?[0-9]:[0-5][0-9] ?- ?[0-2]?[0-9]:([0-5][0-9])/.exec(timeString)[1]);

        let startingColumn = 2 + (startingHour - 7);
        let endingColumn = 2 + (endingHour - 7);
        if(endingMinute) endingColumn++;
        
        const hundredPercentInMinutes = (endingColumn - startingColumn) * 60;

        const marginLeft = startingMinute / hundredPercentInMinutes * 100;
        const marginRight = (!endingMinute) ? 0 : ((60 - endingMinute) / hundredPercentInMinutes * 100);

        return `grid-area: ${rowHeights[dayOfWeek] + 1} / ${startingColumn} / ${rowHeights[dayOfWeek] + 1} / ${endingColumn}; margin-left: ${marginLeft}%; margin-right: ${marginRight}%; margin-top: calc(${offsetTop * rowBaseHeight}rem);`;
    };

    /**
     * Adds a new ticket to the schedule. Note that ticketPlaceGeneral and ticketPlaceSpecific will simply
     * be concatenated together.
     * 
     * @param {string} className can be 'lecture', 'seminar', 'laboratory' or any other custom class name
     * @param {number} ticketDayOfWeek day of week, 0 = monday, ..., 4 = friday
     * @param {number} evenOrOddWeeksOnly 0 for every week, 1 for odd, 2 for even weeks only
     * @param {string} ticketTime time of class in the exact format "HH:MM - HH:MM" (24H)
     * @param {string} parallelNumber code used to designate the parallel (e.g. "107C" or "1P"), can be left empty
     * @param {string} ticketName name of the subject, e.g. "BI-PA2.21" or "BI-LUNCH"
     * @param {string} ticketTeacher name of the teacher
     * @param {string} ticketPlaceGeneral the building where the class takes place (e.g. "TH-A:")
     * @param {string} ticketPlaceSpecific the classroom number/code (e.g. "PU1" or "349")
     * @param {number} offsetTop offset from the top (for rows with height >= 1)
     * @param {Array<number>} rowHeights array of relative row heights (see setRowHeights)
     * @returns the new ticket element
     */
    addTicket(className, ticketDayOfWeek, evenOrOddWeeksOnly, ticketTime, parallelNumber, ticketName,
              ticketTeacher, ticketPlaceGeneral, ticketPlaceSpecific, offsetTop)
    {
        // check parameters
        const eventBaseWrapperStyle = this.__createStyleFromTimeInternal(ticketTime, ticketDayOfWeek, offsetTop);
        if(!eventBaseWrapperStyle)
            return null;
        if(ticketDayOfWeek < 0 || ticketDayOfWeek > 4)
            return null;
        if(evenOrOddWeeksOnly < 0 || evenOrOddWeeksOnly > 2)
            return null;
        if(offsetTop < 0)
            return null;

        // create the new ticket
        const eventBaseWrapper = document.createElement('div');
        eventBaseWrapper.classList.add("event-base-wrapper");
        eventBaseWrapper.style = eventBaseWrapperStyle;

        const ticketWrapper = document.createElement('div');
        ticketWrapper.classList.add('ticket-wrapper', className);

        // i'm not really sure how this works, but we need to steal some sort of ID from
        // another ticket, otherwise the new one won't display with the appropriate styling
        // (i'm really just too lazy to look into it)
        for(let attr of document.querySelector('.event-base-wrapper > .ticket-wrapper').attributes)
        {
            if(attr.name == "class") continue;
            ticketWrapper.setAttribute(attr.name, attr.value);
        }

        // header
        const ticketHeader = document.createElement('div');
        ticketHeader.classList.add('ticket-header');
        for(let attr of document.querySelector('.event-base-wrapper > .ticket-wrapper > .ticket-header').attributes)
        {
            if(attr.name == "class") continue;
            ticketHeader.setAttribute(attr.name, attr.value);
        }

        const ticketHeaderTime = document.createElement('div');
        ticketHeaderTime.classList.add("overflow-hidden");
        ticketHeaderTime.style = "cursor: help; text-decoration: underline dotted; text-underline-position: under;";
        ticketHeaderTime.innerText = ticketTime;
        for(let attr of document.querySelector('.event-base-wrapper > .ticket-wrapper > .ticket-header > .overflow-hidden').attributes)
        {
            if(attr.name == "class") continue;
            ticketHeaderTime.setAttribute(attr.name, attr.value);
        }

        const ticketHeaderDflex = document.createElement('div');
        ticketHeaderDflex.classList.add("d-flex");
        for(let attr of document.querySelector('.event-base-wrapper .ticket-header > .d-flex').attributes)
        {
            if(attr.name == "class") continue;
            ticketHeaderDflex.setAttribute(attr.name, attr.value);
        }

        if(evenOrOddWeeksOnly)
        {
            ticketHeaderDflex.append(document.createElement('div'));
            ticketHeaderDflex.children[0].classList.add("ticket-week");
            ticketHeaderDflex.children[0].innerText = evenOrOddWeeksOnly == 1
                ? (this.locale != TimetableMod.LOCALE_CZ ? "Odd" : "Lichý")
                : (this.locale != TimetableMod.LOCALE_CZ ? "Even" : "Sudý");
            for(let attr of document.querySelector('.event-base-wrapper .ticket-header > .d-flex').attributes)
            {
                if(attr.name == "class") continue;
                ticketHeaderDflex.children[0].setAttribute(attr.name, attr.value);
            }
        }
        if(parallelNumber)
        {
            let boxClass;
            switch(className)
            {
                case "laboratory":
                    boxClass = "L";
                    break;
                case "seminar":
                    boxClass = "C";
                    break;
                default:
                    boxClass = "P";
            }

            ticketHeaderDflex.append(document.createElement('div'));
            ticketHeaderDflex.lastElementChild.classList.add("base-box", "box", "box-parallel", boxClass);
            for(let attr of document.querySelector('.event-base-wrapper .ticket-header > .d-flex > .box').attributes)
            {
                if(attr.name == "class") continue;
                ticketHeaderDflex.lastElementChild.setAttribute(attr.name, attr.value);
            }

            ticketHeaderDflex.lastElementChild.append(document.createElement('span'));
            ticketHeaderDflex.lastElementChild.children[0].innerHTML = `<span>${parallelNumber}</span>`;
            for(let attr of document.querySelector('.event-base-wrapper .ticket-header > .d-flex > .box > span').attributes)
            {
                if(attr.name == "class") continue;
                ticketHeaderDflex.lastElementChild.children[0].setAttribute(attr.name, attr.value);
            }
        }

        ticketHeader.append(ticketHeaderTime, ticketHeaderDflex);

        // body
        const ticketBody = document.createElement('div');
        ticketBody.classList.add('ticket-body');
        ticketBody.innerHTML = `
            <div>${ticketName}</div>
            <div class="overflow-hidden" style="cursor: help; text-decoration: underline dotted; text-underline-position: under;">
            ${ticketTeacher}
            </div>`;

        for(let attr of document.querySelector('.event-base-wrapper .ticket-body').attributes)
        {
            if(attr.name == "class") continue;
            ticketBody.setAttribute(attr.name, attr.value);
        }
        for(let attr of document.querySelector('.event-base-wrapper .ticket-body > div').attributes)
        {
            if(attr.name == "class") continue;
            ticketBody.children[0].setAttribute(attr.name, attr.value);
        }
        for(let attr of document.querySelector('.event-base-wrapper .ticket-body > div.overflow-hidden').attributes)
        {
            if(attr.name == "class") continue;
            ticketBody.children[1].setAttribute(attr.name, attr.value);
        }

        // footer
        const ticketFooter = document.createElement('div');
        ticketFooter.classList.add('ticket-footer');
        ticketFooter.innerHTML = `
            <div class="overflow-hidden" style="cursor: help; text-decoration: underline dotted; text-underline-position: under;">
            <span>${ticketPlaceGeneral}<strong>${ticketPlaceSpecific}</strong></span>
            </div>`;

        for(let attr of document.querySelector('.event-base-wrapper .ticket-footer').attributes)
        {
            if(attr.name == "class") continue;
            ticketFooter.setAttribute(attr.name, attr.value);
        }
        for(let attr of document.querySelector('.event-base-wrapper .ticket-footer > .overflow-hidden').attributes)
        {
            if(attr.name == "class") continue;
            ticketFooter.children[0].setAttribute(attr.name, attr.value);
        }

        // append ticket to the container
        const container = document.querySelector('.schedule-grid');

        ticketWrapper.append(ticketHeader, ticketBody, ticketFooter);
        eventBaseWrapper.append(ticketWrapper);
        container.append(eventBaseWrapper);

        this.addedTickets.push(eventBaseWrapper);
    };
}

// GUI class

class TimetableModGuiScreen
{
    constructor(gui)
    {
        this.gui = gui;
        this.element = document.createElement('div');
        this.element.style = "display: flex; flex-direction: column; padding: 1em;";
    }

    addElement(type, innerHTML, clickCallback, attributes = [])
    {
        const element = document.createElement(type);
        element.innerHTML = innerHTML;
        element.addEventListener('click', clickCallback);

        if(attributes)
            for(let i = 0; i < attributes.length; i++)
                element.setAttribute(attributes[i].name, attributes[i].value);

        this.element.appendChild(element);
    }

    addSelect(id, options)
    {
        const selectElement = document.createElement('select');
        selectElement.setAttribute('id', id);

        for(let option of options)
        {
            const optionElement = document.createElement('option');
            optionElement.setAttribute('value', option);
            optionElement.innerText = option;
            selectElement.appendChild(optionElement);
        }

        this.element.appendChild(selectElement);
    }
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const weekParities = ['Every week', 'Odd weeks only', 'Even weeks only'];

class TimetableModGui
{
    constructor()
    {
        this.mod = new TimetableMod('CZE');
        this.css = `
            .kos-timetable-mod-gui { width: 400px; position: fixed; bottom: 25px; right: 25px; background-color: white; border: 2px solid #0065bd; }
            .kos-timetable-mod-gui > div > * { margin-bottom: 0.25em; }
        `;
        this.courseTypes = ['lecture', 'seminar', 'laboratory'];
        this.rowHeights = this.mod.getRowHeights();

        this.screenMain = new TimetableModGuiScreen(this);
        this.screenMain.addElement('button', 'Add ticket', () => { this.switchScreen(this.screenAddTicket); });
        this.screenMain.addElement('button', 'Add course type', () => { this.switchScreen(this.screenAddCourseType); }, [{name: 'disabled', value: ''}]);
        this.screenMain.addElement('button', 'Rename course', () => { this.switchScreen(this.screenRenameCourse); });
        this.screenMain.addElement('button', 'Edit tickets', () => { this.switchScreen(this.screenEditTickets); }, [{name: 'disabled', value: ''}]);
        this.screenMain.addElement('button', 'Set row heights', () => { this.switchScreen(this.screenSetRowHeights); });
        this.screenMain.addElement('button', 'Save layout as javascript', () => {  }, [{name: 'disabled', value: ''}]);
        this.screenMain.addElement('button', 'Load saved javascript', () => {  }, [{name: 'disabled', value: ''}]);
        this.screenMain.addElement('hr', '', null);
        this.screenMain.addElement('button', 'Close GUI', () => { this.setVisible(false); console.log("Reopen GUI by typing: gui.setVisible(true)"); });

        this.screenAddTicket = new TimetableModGuiScreen(this);
        this.screenAddTicket.addElement('label', 'Name:', null);
        this.screenAddTicket.addElement('input', '', null, [{name: 'id', value: 'screenAddTicket_Name'}]);
        this.screenAddTicket.addElement('label', 'Type:', null);
        this.screenAddTicket.addSelect ('screenAddTicket_Type', this.courseTypes);
        this.screenAddTicket.addElement('label', 'Teacher:', null);
        this.screenAddTicket.addElement('input', '', null, [{name: 'id', value: 'screenAddTicket_Teacher'}]);
        this.screenAddTicket.addElement('label', 'Day of week:', null);
        this.screenAddTicket.addSelect ('screenAddTicket_DayOfWeek', daysOfWeek);
        this.screenAddTicket.addElement('label', 'Week parity:', null);
        this.screenAddTicket.addSelect ('screenAddTicket_WeekParity', weekParities);
        this.screenAddTicket.addElement('label', 'Time:', null);
        this.screenAddTicket.addElement('input', '', null, [{name: 'placeholder', value: '(H)H:MM-(H)H:MM (24H format)'}, {name: 'id', value: 'screenAddTicket_Time'}]);
        this.screenAddTicket.addElement('label', 'Parallel code:', null);
        this.screenAddTicket.addElement('input', '', null, [{name: 'placeholder', value: 'e.g. 118C, 2P, ...'}, {name: 'id', value: 'screenAddTicket_Parallel'}]);
        this.screenAddTicket.addElement('label', 'Location (general):', null);
        this.screenAddTicket.addElement('input', '', null, [{name: 'placeholder', value: 'e.g. T9:'}, {name: 'id', value: 'screenAddTicket_LocationGeneral'}]);
        this.screenAddTicket.addElement('label', 'Location (specific):', null);
        this.screenAddTicket.addElement('input', '', null, [{name: 'placeholder', value: 'e.g. 105'}, {name: 'id', value: 'screenAddTicket_LocationSpecific'}]);
        this.screenAddTicket.addElement('label', 'Offset from top:', null);
        this.screenAddTicket.addElement('input', '', null, [{name: 'type', value: 'number'}, {name: 'min', value: 0}, {name: 'max', value: 4}, {name: 'value', value: 0}, {name: 'id', value: 'screenAddTicket_Offset'}]);
        this.screenAddTicket.addElement('hr', '', null);
        this.screenAddTicket.addElement('button', 'Go back', () => { this.switchScreen(this.screenMain); });
        this.screenAddTicket.addElement('button', 'Add ticket', () => {
            /* this.mod.addTicket() ...*/
            const ticketName = document.querySelector('#screenAddTicket_Name').value;
            const ticketType = document.querySelector('#screenAddTicket_Type').value;
            const ticketTeacher = document.querySelector('#screenAddTicket_Teacher').value;
            const ticketDayOfWeek = daysOfWeek.indexOf(document.querySelector('#screenAddTicket_DayOfWeek').value);
            const ticketWeekParity = weekParities.indexOf(document.querySelector('#screenAddTicket_WeekParity').value);
            const ticketTimeString = document.querySelector('#screenAddTicket_Time').value;
            const ticketParallel = document.querySelector('#screenAddTicket_Parallel').value;
            const ticketLocationGeneral = document.querySelector('#screenAddTicket_LocationGeneral').value;
            const ticketLocationSpecific = document.querySelector('#screenAddTicket_LocationSpecific').value;
            const ticketOffset = document.querySelector('#screenAddTicket_Offset').value;

            // input check
            if(!ticketName || this.courseTypes.indexOf(ticketType) == -1 || ticketDayOfWeek == -1 || ticketWeekParity == -1 || ticketOffset < 0)
            {
                alert("Please fill out all required fields.");
                return;
            }

            if(!this.mod.__createStyleFromTimeInternal(ticketTimeString, 0, 0))
            {
                alert("Please correct the time format. Must match (H)H:MM-(H)H:MM (24H format)");
                return;
            }

            this.mod.addTicket(ticketType, ticketDayOfWeek, ticketWeekParity, ticketTimeString, ticketParallel, ticketName, ticketTeacher, ticketLocationGeneral, ticketLocationSpecific, ticketOffset);
        });

        this.screenAddCourseType = new TimetableModGuiScreen(this);
        this.screenAddCourseType.addElement('label', 'CSS compliant class name:', null);
        this.screenAddCourseType.addElement('input', '', null);
        this.screenAddCourseType.addElement('label', 'Background colour:', null);
        this.screenAddCourseType.addElement('input', '', null, [{name: 'type', value: 'color'}]);
        this.screenAddCourseType.addElement('label', 'Accent colour:', null);
        this.screenAddCourseType.addElement('input', '', null, [{name: 'type', value: 'color'}]);
        this.screenAddCourseType.addElement('hr', '', null);
        this.screenAddCourseType.addElement('button', 'Go back', () => { this.switchScreen(this.screenMain); });
        this.screenAddCourseType.addElement('button', 'Add style', () => { /* this.mod.addClassStyle() ...*/ });

        this.screenRenameCourse = new TimetableModGuiScreen(this);
        this.screenRenameCourse.addElement('label', 'Rename from:', null);
        this.screenRenameCourse.addElement('input', '', null, [{name: 'id', value: 'screenRenameCourse_RenameFrom'}]);
        this.screenRenameCourse.addElement('label', 'Rename to:', null);
        this.screenRenameCourse.addElement('input', '', null, [{name: 'id', value: 'screenRenameCourse_RenameTo'}]);
        this.screenRenameCourse.addElement('hr', '', null);
        this.screenRenameCourse.addElement('button', 'Go back', () => { this.switchScreen(this.screenMain); });
        this.screenRenameCourse.addElement('button', 'Rename course', () => {
            /* this.mod.renameCourse() ...*/
            const renameFrom = document.querySelector('#screenRenameCourse_RenameFrom');
            const renameTo = document.querySelector('#screenRenameCourse_RenameTo');

            this.mod.renameCourse(renameFrom.value, renameTo.value);
            renameFrom.value = "";
            renameTo.value = "";
        });
        
        this.screenEditTickets = new TimetableModGuiScreen(this);
        this.screenEditTickets.addElement('span', '[ TODO ]', null);
        this.screenEditTickets.addElement('hr', '', null);
        this.screenEditTickets.addElement('button', 'Go back', () => { this.switchScreen(this.screenMain); });

        this.screenSetRowHeights = new TimetableModGuiScreen(this);
        this.screenSetRowHeights.addElement('label', 'Monday:', null);
        this.screenSetRowHeights.addElement('input', '', null, [{name: 'id', value: 'screenSetRowHeights_0'}, {name: 'type', value: 'number'}, {name: 'min', value: 1}, {name: 'max', value: 4}, {name: 'value', value: this.rowHeights[0]}]);
        this.screenSetRowHeights.addElement('label', 'Tuesday:', null);
        this.screenSetRowHeights.addElement('input', '', null, [{name: 'id', value: 'screenSetRowHeights_1'}, {name: 'type', value: 'number'}, {name: 'min', value: 1}, {name: 'max', value: 4}, {name: 'value', value: this.rowHeights[1]}]);
        this.screenSetRowHeights.addElement('label', 'Wednesday:', null);
        this.screenSetRowHeights.addElement('input', '', null, [{name: 'id', value: 'screenSetRowHeights_2'}, {name: 'type', value: 'number'}, {name: 'min', value: 1}, {name: 'max', value: 4}, {name: 'value', value: this.rowHeights[2]}]);
        this.screenSetRowHeights.addElement('label', 'Thursday:', null);
        this.screenSetRowHeights.addElement('input', '', null, [{name: 'id', value: 'screenSetRowHeights_3'}, {name: 'type', value: 'number'}, {name: 'min', value: 1}, {name: 'max', value: 4}, {name: 'value', value: this.rowHeights[3]}]);
        this.screenSetRowHeights.addElement('label', 'Friday:', null);
        this.screenSetRowHeights.addElement('input', '', null, [{name: 'id', value: 'screenSetRowHeights_4'}, {name: 'type', value: 'number'}, {name: 'min', value: 1}, {name: 'max', value: 4}, {name: 'value', value: this.rowHeights[4]}]);
        this.screenSetRowHeights.addElement('hr', '', null);
        this.screenSetRowHeights.addElement('button', 'Go back', () => { this.switchScreen(this.screenMain); });
        this.screenSetRowHeights.addElement('button', 'Set heights', () => {
            /* ... this.mod.setRowHeights(...) */
            const rowHeights = [];
            for(let i = 0; i < 5; i++)
                rowHeights.push(0 + document.querySelector(`#screenSetRowHeights_${i}`).value);
            
            this.mod.setRowHeights(rowHeights);
        });

        this.guiStylesheet = document.createElement('style');
        this.guiStylesheet.innerHTML = this.css;
        document.head.appendChild(this.guiStylesheet);

        this.guiRootElement = document.createElement('div');
        this.guiRootElement.classList.add('kos-timetable-mod-gui');
        document.body.append(this.guiRootElement);

        this.switchScreen(this.screenMain);
    }

    switchScreen(screen)
    {
        for(let child of this.guiRootElement.children)
            this.guiRootElement.removeChild(child);
        
        this.guiRootElement.appendChild(screen.element);
    }

    setVisible(visible)
    {
        this.guiRootElement.style.display = visible ? '' : 'none';
    }
}

// initialize GUI
const gui = new TimetableModGui();