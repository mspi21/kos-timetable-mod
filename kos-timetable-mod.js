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
        for(let height of heights)
            if(typeof(height) != typeof(1))
                return false;

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
        if(!/^[0-2]?[0-9]:[0-5][0-9] - [0-2]?[0-9]:[0-5][0-9]$/.test(timeString))
            return "";

        //rowHeights.forEach((value, index, array) => {if(index > 0) array[index] += array[index - 1];});
        const rowHeights = [1, 2, 3, 4, 5];
        const rowBaseHeight = Number.parseFloat(getComputedStyle(document.querySelector(".schedule-grid")).getPropertyValue('--row-height'));

        const startingHour = Number(/^[0-2]?[0-9]/.exec(timeString));
        const startingMinute = Number(/^[0-2]?[0-9]:([0-5][0-9])/.exec(timeString)[1]);
        const endingHour = Number(/^[0-2]?[0-9]:[0-5][0-9] - ([0-2]?[0-9])/.exec(timeString)[1]);
        const endingMinute = Number(/^[0-2]?[0-9]:[0-5][0-9] - [0-2]?[0-9]:([0-5][0-9])/.exec(timeString)[1]);

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
        if(typeof(ticketDayOfWeek) != typeof(1) || ticketDayOfWeek < 0 || ticketDayOfWeek > 4)
            return null;
        if(typeof(evenOrOddWeeksOnly) != typeof(1) || evenOrOddWeeksOnly < 0 || evenOrOddWeeksOnly > 2)
            return null;
        if(typeof(offsetTop) != typeof(1))
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
