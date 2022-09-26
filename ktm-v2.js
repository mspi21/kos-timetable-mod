const generateUUID = () => {
    //#Source: https://bit.ly/2neWfJ2 
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(
        /[018]/g, c => (
            c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
        ).toString(16)
    )
}

const KosWeekParity = Object.freeze({
    all_weeks: '',
    odd_weeks: 'Lichý',
    even_weeks: 'Sudý'
})

const KosDayOfWeek = Object.freeze({
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4
})

class Ticket {

    constructor(id, course_event, html_element = undefined) {
        this.id = id
        this.course_event = course_event
        this.root = document.querySelector('.schedule-grid')
        this.element = html_element || this.createDom()
        this.added_by_user = html_element === undefined
    }

    static _createTicketDiv(course_event) {
        const ret = document.createElement('div')
        ret.classList.add('event-base-wrapper')
        ret.style.cssText = Ticket._createPositionCss(course_event.time_of_week, 0)
        ret.appendChild(Ticket._createTicketWrapper(course_event))
        return ret
    }

    static _createTicketWrapper(course_event) {
        const ticket_wrapper = document.createElement('div')
        ticket_wrapper.classList.add('ticket-wrapper', course_event.type)
        ticket_wrapper.style.cssText = `
            height: 100%;
            padding-left: .125em;
            display: flex;
            flex-direction: column;
            font-size: .8rem;
            border-left: ${course_event.style.color_dark} solid .25rem;
            background-color: ${course_event.style.color_light};
        `

        ticket_wrapper.appendChild(Ticket._createTicketHeader(course_event))
        ticket_wrapper.appendChild(Ticket._createTicketBody(course_event))
        if(course_event.location)
            ticket_wrapper.appendChild(Ticket._createTicketFooter(course_event))

        return ticket_wrapper
    }

    static _createTicketHeader(course_event) {
        const ticket_header = document.createElement('div')
        ticket_header.classList.add('ticket-header')
        ticket_header.style.cssText = `
            display: flex;
            justify-content: space-between;
            white-space: nowrap;
            overflow: hidden;
            font-size: .8rem;
        `

        const th_overflow_hidden = document.createElement('div')
        th_overflow_hidden.classList.add('overflow-hidden')
        th_overflow_hidden.setAttribute('data-testid', 'ticket-time')
        th_overflow_hidden.style.cssText = `
            white-space: nowrap;
            font-size: .8rem;
        `
        th_overflow_hidden.innerText = Ticket._kosTimeToString(course_event.time_of_week);
        ticket_header.appendChild(th_overflow_hidden)

        if(course_event.parallel)
        {
            const th_dflex = document.createElement('div')
            th_dflex.classList.add('d-flex')
            th_dflex.style.cssText = `
                white-space: nowrap;
                font-size: .8rem;
            `
            ticket_header.appendChild(th_dflex)

            if(course_event.week_parity !== KosWeekParity.all_weeks)
            {
                const ticket_week = document.createElement('div')
                ticket_week.classList.add('ticket-week')
                ticket_week.style.cssText = `
                    background-color: #484b52;
                    color: #fff;
                    padding: 0 .125rem;
                    text-transform: uppercase;
                    white-space: nowrap;
                    font-size: .8rem;
                `
                ticket_week.innerText = course_event.week_parity
                th_dflex.appendChild(ticket_week)
            }

            const base_box = document.createElement('div')
            base_box.classList.add('base-box', 'box', 'box-parallel')
            course_event.type === 'lecture' && base_box.classList.add('P')
            course_event.type === 'seminar' && base_box.classList.add('C')
            base_box.style.cssText = `
                color: #fff;
                font-size: .8rem;
                padding: 0 .125rem;
                display: inline-block;
                text-align: center;
                line-height: 1.4;
                font-weight: 700;
                white-space: nowrap;
                background-color: ${course_event.style.color_dark};
            `
            th_dflex.appendChild(base_box)

            const outer_span = document.createElement('span')
            outer_span.style.cssText = `
                color: #fff;
                font-size: .8rem;
                text-align: center;
                line-height: 1.4;
                font-weight: 700;
                white-space: nowrap;
            `
            base_box.appendChild(outer_span)

            const inner_span = document.createElement('span')
            inner_span.innerText = course_event.parallel;
            outer_span.appendChild(inner_span)
        }

        return ticket_header
    }

    static _createTicketBody(course_event) {
        const ticket_body = document.createElement('div')
        ticket_body.classList.add('ticket-body')
        ticket_body.style.cssText = `
            font-weight: 700;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: .8rem;
        `

        const ticket_display_name = document.createElement('div')
        ticket_display_name.innerText = course_event.course.display_name
                                     || course_event.course.official_name
        ticket_body.appendChild(ticket_display_name)

        if(course_event.teacher)
        {
            const ticket_display_teacher = document.createElement('div')
            ticket_display_teacher.classList.add('overflow-hidden')
            ticket_display_teacher.style.cssText = `
                cursor: help;
                text-decoration: underline dotted;
                text-underline-position: under;
                white-space: nowrap;
                font-size: .8rem;
                font-weight: 400;
            `
            ticket_display_teacher.innerText = course_event.teacher
            ticket_body.appendChild(ticket_display_teacher)
        }

        return ticket_body
    }

    static _createTicketFooter(course_event) {
        const ticket_footer = document.createElement('div')
        ticket_footer.classList.add('ticket-footer')
        ticket_footer.style.cssText = `
            margin-top: auto;
            display: flex;
            justify-content: space-between;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: .8rem;
        `

        const tf_overflow_hidden = document.createElement('div')
        tf_overflow_hidden.classList.add('overflow-hidden')
        tf_overflow_hidden.style.cssText = `
            cursor: help;
            text-decoration: underline dotted;
            text-underline-position: under;
            white-space: nowrap;
            font-size: .8rem;
        `
        ticket_footer.appendChild(tf_overflow_hidden)
        
        const tf_span = document.createElement('span')
        tf_span.innerHTML = `${course_event.location.general}<strong>${course_event.location.specific}</strong>`
        tf_overflow_hidden.appendChild(tf_span)

        return ticket_footer
    }

    static _kosTimeToString({ begin_hour, begin_minute, end_hour, end_minute}) {
        const format_minutes = (minutes) => {
            if(!minutes) return '00'
            return (minutes < 10) ? ('0' + minutes) : ('' + minutes);
        }
        
        let res = ''
        res += begin_hour + ':'
        res += format_minutes(begin_minute)
        res += '\u2013' // en dash
        res += end_hour + ':'
        res += format_minutes(end_minute)
        return res
    }

    static _createPositionCss(time_of_week, offset_top) {
        const row_heights = [1, 2, 3, 4, 5]
        const schedule_grid = document.querySelector('.schedule-grid');
        if(!schedule_grid)
            throw new Error(`Could not find element by selecting .schedule-grid`)
        const row_base_height = Number.parseFloat(getComputedStyle(schedule_grid).getPropertyValue('--row-height'))

        const { begin_minute, begin_hour, end_minute, end_hour, day } = time_of_week

        let starting_column = 2 + (begin_hour - 7)
        let ending_column = 2 + (end_hour - 7)
        if(end_minute) ending_column++
        
        const hundred_percent_in_minutes = (ending_column - starting_column) * 60

        const margin_left = begin_minute / hundred_percent_in_minutes * 100
        const margin_right = (!end_minute) ? 0 : ((60 - end_minute) / hundred_percent_in_minutes * 100)

        return `
            grid-area:
                ${row_heights[day] + 1} /
                ${starting_column} /
                ${row_heights[day] + 1} /
                ${ending_column};
            margin-left: ${margin_left}%;
            margin-right: ${margin_right}%;
            margin-top: calc(${offset_top * row_base_height}rem);
        `
    }

    createDom() {
        const element = Ticket._createTicketDiv(this.course_event)
        this.root.appendChild(element)
        return element
    }

    removeFromDom() {
        this.element.parentElement.removeChild(this.element)
        delete this.element
    }

    refreshDom() {
        this.removeFromDom()
        this.element = this.createDom()
    }
}

class ModApi {
    constructor() {
        this._styles = [
            {
                id: 'lecture',
                color_dark: '#F0AB00',
                color_light: '#fceecc'
            },
            {
                id: 'seminar',
                color_dark: '#A2AD00',
                color_light: '#f6f7e6'
            }
        ]
        this._courses = []
        this._tickets = []
        this._root = document.querySelector('.schedule-grid')
        if(!this._root)
            throw new Error(`Could not find schedule root element ('.schedule-grid'). `
            + `Make sure you run this script on a loaded schedule page at https://new.kos.cvut.cz/schedule`)

        console.log(`Parsing tickets already in the schedule...`)
        this._parseExistingElements()
        console.log(`Successfully parsed ${this._tickets.length} tickets.`)
    }

    get createTicketWhich() {
        return new TicketBuilder(this._courses, this._styles);
    }

    _parseExistingElements() {
        const elements = document.querySelectorAll('.schedule-grid > .event-base-wrapper')
        elements.forEach(element => {
            // parse Course
            const display_name = element.querySelector('.ticket-body > div')?.innerHTML
            let course_ref = this._courses.find(c => c.official_name == display_name)
                          || this._courses[this._courses.push({ official_name: display_name }) - 1]
            
            // parse CourseEvent
            const course_event = {
                course: course_ref,
                type: this._styles.find(s => s.id === element.querySelector('.ticket-wrapper').classList.item(1)),
                time_of_week: this._parseKosTime(element),
                week_parity: element.querySelector('.ticket-week')?.innerHTML || KosWeekParity.all_weeks,
                parallel: element.querySelector('.d-flex > .base-box.box.box-parallel > span > span')?.innerHTML,
                teacher: element.querySelector('.ticket-body > .overflow-hidden')?.innerHTML,
                location: this._parseKosLocation(element)
            }

            // add Ticket to tickets
            this._tickets.push(new Ticket(generateUUID(), course_event, element))
        });
    }

    _parseKosTime(element) {
        const time_string = element.querySelector('.ticket-header > .overflow-hidden').innerHTML
        const day = parseInt(element.style.gridArea) - 2
        
        return {
            begin_hour: Number(/^[0-2]?[0-9]/.exec(time_string)),
            begin_minute: Number(/^[0-2]?[0-9]:([0-5][0-9])/.exec(time_string)[1]),
            end_hour: Number(/^[0-2]?[0-9]:[0-5][0-9] - ([0-2]?[0-9])/.exec(time_string)[1]),
            end_minute: Number(/^[0-2]?[0-9]:[0-5][0-9] - [0-2]?[0-9]:([0-5][0-9])/.exec(time_string)[1]),
            day
        }
    }

    _parseKosLocation(element) {
        const location_string = element.querySelector('.ticket-footer > .overflow-hidden > span')?.innerHTML
        if(!location_string) return undefined

        // assume that location_string has format "general<strong>specific</strong>"
        const parts = location_string.split('<strong>')
        return {
            general: parts[0],
            specific: parts[1].replace('</strong>', '')
        }
    }

    _refreshTickets(predicate) {
        this._tickets.filter(predicate).forEach(ticket => ticket.refreshDom())
    }

    _removeTickets(predicate) {
        this._tickets.filter(predicate).forEach(ticket => {
            ticket.removeFromDom()
        })

        const not = (predicate) => ((thing) => !predicate(thing))
        this._tickets = this._tickets.filter(not(predicate))
    }

    getStyles() {
        return this._styles;
    }

    addStyle(class_name, color_dark, color_light) {
        if(this._styles.find(s => s.id === class_name))
            throw new Error(`There is already a style with the name '${class_name}. `
                + `Please choose another name or use the updateStyle method.'`)
        if(!/^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(class_name))
            throw new Error(`Style names have to follow css class naming conventions:\n`
                + `A valid name should start with an underscore (_), a hyphen (-) or a letter `
                + `(a-z)/(A-Z) which is followed by any numbers, hyphens, underscores, letters.`)
        this._styles.push({id: class_name, color_dark, color_light })
        this._refreshTickets(ticket => ticket.course_event.type === class_name)
    }

    updateStyle(class_name, fn_update) {
        const style = this._styles.find(s => s.id === class_name)
        if(!style)
            throw new Error(`Could not find a style with name '${class_name}.'`)
        fn_update(style)
        this._refreshTickets(ticket => ticket.course_event.type === class_name)
    }

    removeStyle(class_name) {
        this._styles = this._styles.filter(s => s.id !== class_name)
        this._refreshTickets(ticket => ticket.course_event.type === class_name)
    }

    getCourses() {
        return this._courses
    }

    addCourse(official_name, display_name = undefined) {
        if(this._courses.some(c => c.official_name === official_name))
            throw new Error(`There is already a course with the official name '${official_name}.`
                + `Please choose another name or remove the other course using the removeCourse method.'`)
        this._courses.push({ official_name: Object.freeze(official_name), display_name })
    }

    updateCourse(official_name, fn_update) {
        const course = this._courses.find(c => c.official_name === official_name)
        if(!course)
            throw new Error(`Could not find a course with official name '${official_name}.'`)
        fn_update(course)
        this._refreshTickets(ticket => ticket.course_event.course.official_name === official_name)
    }

    removeCourse(official_name) {
        const course = this._courses.find(c => c.official_name === official_name)
        if(!course)
            throw new Error(`Could not find a course with official name '${official_name}.'`)
        
        // maybetodo check if any tickets exist (make ux more friendly)?
        // for now, just delete all tickets associated with course
        this._removeTickets(ticket => ticket.course_event.course.official_name === official_name)
    }

    getTickets() {
        return this._tickets
    }

    // course argument refers to official_name (id) of course
    addTicket(ticket_builder) {
        if(!(ticket_builder instanceof TicketBuilder))
            throw new Error(`Wrong type for argument 'ticket_builder: must be an instance of TicketBuilder.'`)
        
        const uuid = ticket_builder.uuid
        const event = ticket_builder.course_event

        if(event.course === undefined ||
            event.style === undefined ||
            event.time_of_week === undefined ||
            event.week_parity === undefined)
            throw new Error(`Added ticket must have at least these fields: 'course', 'style', 'time_of_week', 'week_parity'.`)

        this._tickets.push(new Ticket(uuid, event))
        this._refreshTickets(ticket => ticket.id === uuid)
        return uuid
    }

    updateTicket(id, fn_update) {
        const ticket = this._tickets.find(ticket => ticket.id === id)
        if(!ticket)
            throw new Error(`No ticket with id '${id}'`)
        fn_update(ticket.course_event)
        this._refreshTickets(ticket => ticket.id === id)
    }

    removeTicket(id) {
        this._removeTickets(ticket => ticket.id === id)
    }
}

class TicketBuilder {
    constructor(courses, styles) {
        this._courses = courses
        this._styles = styles
        this._course_event = {}
        this._uuid = generateUUID()
    }

    get uuid() {
        return this._uuid
    }

    get course_event() {
        return this._course_event
    }

    belongsToCourse(course_name) {
        const course_ref = this._courses.find(c => c.official_name === course_name)
        if(!course_ref)
            throw new Error(`Could not find a course with official name '${course}.'`)
        this._course_event.course = course_ref
        return this
    }

    hasStyle(style) {
        const style_ref = this._styles.find(s => s.id === style)
        if(!style_ref)
            throw new Error(`Could not find a style with classname '${style}.'`)
        this._course_event.style = style_ref
        return this
    }

    takesPlaceAtTime(time_of_week, week_parity = KosWeekParity.all_weeks) {
        if(typeof(time_of_week) !== 'object'
        || time_of_week.day === undefined
        || time_of_week.begin_hour === undefined
        || time_of_week.begin_minute === undefined
        || time_of_week.end_hour === undefined
        || time_of_week.end_minute === undefined)
            throw new Error(`Incorrect type for argument 'time_of_week'.`)
        
        if(!Object.values(KosWeekParity).includes(week_parity))
            throw new Error(`Argument 'week_parity' must be member of KosWeekParity.`)
        
        this._course_event.time_of_week = time_of_week
        this._course_event.week_parity = week_parity
        return this
    }

    takesPlaceAtLocation(place) {
        if(typeof(place) !== 'object'
        || place.general === undefined
        || place.specific === undefined)
            throw new Error(`Incorrect type for argument 'place'.`)
        
        this._course_event.location = place
        return this
    }

    hasParallelCode(code) {
        this._course_event.parallel = code
        return this
    }

    isTaughtBy(teacher) {
        this._course_event.teacher = teacher
        return this
    }
}

class SingleVue {
    static async getInstance() {
        if(!SingleVue.instance)
            SingleVue.instance = await new Promise((resolve, _) => {
                const scriptEl = document.createElement('script');
                scriptEl.setAttribute('src', 'https://unpkg.com/vue@3');
                scriptEl.addEventListener('load', function() { resolve(Vue) });
                document.head.appendChild(scriptEl);
            });
        return SingleVue.instance;
    }
}

const ButtonComponent = {
    props: {
        text: {
            type: String,
            default: null
        },
    },
    emits: ['click'],
    template: `
        <button
            class="btn button-container btn-primary btn-md button-component w100"
            @click="$emit('click', $event)"
        >
            {{ text }}
        </button>
    `
};

const SelectableListComponent = {
    props: {
        id: {
            type: String,
            default: () => generateUUID()
        },
        options: {
            type: Array,
            default: [],
        }
    },
    computed: {
        header() {
            return Object.keys(this.options[0] || {}).filter(k => k !== 'id');
        },
    },
    template: `
        <table v-if="options && options.length" style="width: 100%;">
            <thead>
                <tr>
                    <th v-for="column in header" :id="column">{{ column }}</th>
                    <th>X</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="option in options" :id="option.id">
                    <td v-for="column in header" :id="column">
                        <div class="mod-color-detail" v-if="typeof(option[column]) === 'object' && option[column].type === 'color'">
                            <div class="mod-color-box" :style="{ backgroundColor: option[column].value }"></div>
                            {{ option[column].value }}
                        </div>
                        <div v-else>{{ option[column] }}</div>
                    </td>
                    <td>
                        <input type="radio" :name="id" :value="option.id" @input="$emit('select', option.id)">
                    </td>
                </tr>
            </tbody>
        </table>
        <div v-else>
            No data
        </div>
    `,
    emits: ['select']
};

const MainScreenComponent = {
    data() {
        return {
            CoursesScreenComponent,
            StylesScreenComponent,
            TicketsScreenComponent
        };
    },
    emits: ['setscreen'],
    template: `
    <div class="mod-gui-screen">
        <div class="bld fs18">Kos Schedule Mod v2</div>
        <div><v-button text="Courses" @click="$emit('setscreen', CoursesScreenComponent)" /></div>
        <div><v-button text="Styles" @click="$emit('setscreen', StylesScreenComponent)" /></div>
        <div><v-button text="Tickets" @click="$emit('setscreen', TicketsScreenComponent)" /></div>
    </div>
    `,
    components: {
        "v-button": ButtonComponent,
    }
};

const CoursesScreenComponent = {
    template: `
    <div class="mod-gui-screen">
        <div class="bld fs18">Courses</div>
        <div><v-button text="Go Back" @click="$emit('goback')" /></div>
    </div>
    `,
    emits: ['goback'],
    components: {
        "v-button": ButtonComponent,
    }
};

const StylesScreenComponent = {
    inject: ['api'],
    data() {
        return {
            AddStyleScreenComponent,
            styles: [],
            selectedStyleId: null,
        };
    },
    methods: {
        refreshStyles() {
            this.styles = this.api.getStyles().map(s => ({
                id: s.id,
                'Id': s.id,
                'Background Colour': {
                    type: 'color',
                    value: s.color_light,
                },
                'Accent Colour': {
                    type: 'color',
                    value: s.color_dark,
                }
            }));
        },
        setSelectedStyle(id) {
            this.selectedStyleId = id;
        },
        removeSelectedStyle() {
            this.api.removeStyle(this.selectedStyleId);
            this.selectedStyleId = null;
            this.refreshStyles();
        }
    },
    computed: {
        hasSelectedStyle() {
            return this.selectedStyleId !== null;
        }
    },
    mounted() {
        this.refreshStyles();
    },
    template: `
    <div class="mod-gui-screen">
        <div class="bld fs18">Styles</div>
        <div>
            <v-selectable-list id="select_style" :options="styles" @select="setSelectedStyle($event)">
            </v-selectable-list>
        </div>
        <div class="mod-button-group">
            <v-button text="Add style" @click="$emit('setscreen', AddStyleScreenComponent)" />
            <v-button :disabled="!hasSelectedStyle" text="Edit style" />
            <v-button :disabled="!hasSelectedStyle" text="Remove style" @click="removeSelectedStyle" />
        </div>
        <div><v-button text="Go Back" @click="$emit('goback')" /></div>
    </div>
    `,
    emits: ['setscreen', 'goback'],
    components: {
        "v-button": ButtonComponent,
        "v-selectable-list": SelectableListComponent,
    }
};

const AddStyleScreenComponent = {
    inject: ['api'],
    data() {
        return {
            styleId: '',
            colorLight: '#fceecc',
            colorDark: '#F0AB00',
            error: '',
        };
    },
    methods: {
        save() {
            console.log(this.colorDark, this.colorLight);
            if(this.api.getStyles().some(s => s.id === this.styleId)) {
                this.showError(`There is already a style with id '${this.styleId}'.`);
                return;
            }
            this.api.addStyle(this.styleId, this.colorDark, this.colorLight);
            this.$emit('goback');
        },
        showError(e) {
            this.error = e;
        },
        dismissError() {
            this.error = '';
        }
    },
    template: `
    <div class="mod-error alert-content" v-if="error">
        <div>{{ error }}</div>
        <v-button text="Dismiss" @click="dismissError" />
    </div>
    <div class="mod-gui-screen" v-else>
        <div class="bld fs18">Add New Style</div>
        <table style="width: 100%;">
            <thead></thead>
            <tbody>
                <tr>
                    <td>Id</td>
                    <td><input type="text" v-model="styleId"></input></td>
                </tr>
                <tr>
                    <td>Background Colour</td>
                    <td><input type="color" v-model="colorLight"></input></td>
                </tr>
                <tr>
                    <td>Accent Colour</td>
                    <td><input type="color" v-model="colorDark"></td>
                </tr>
            </tbody>
        </table>
        <div class="mod-button-group">
            <div><v-button text="Save" @click="save" /></div>
            <div><v-button text="Cancel" @click="$emit('goback')" /></div>
        </div>
    </div>
    `,
    emits: ['goback'],
    components: {
        "v-button": ButtonComponent,
    }
};

const TicketsScreenComponent = {
    template: `
    <div class="mod-gui-screen">
        <div class="bld fs18">Tickets</div>
        <div><v-button text="Go Back" @click="$emit('goback')" /></div>
    </div>
    `,
    inject: ['api'],
    emits: ['goback'],
    components: {
        "v-button": ButtonComponent,
    }
};

const ModApp = {
    template: `
        <component
            :is="screen"
            @setscreen="setScreen($event)"
            @goback="setPreviousScreen"
        ></component>
    `,
    components: {
        MainScreenComponent,
    },
    data() {
        return {
            screen: MainScreenComponent,
            screenHistory: [MainScreenComponent],
        };
    },
    methods: {
        setScreen(component) {
            if(component) {
                this.screen = component;
                this.screenHistory.push(component);
            }
        },
        setPreviousScreen() {
            if(this.screenHistory.length > 1) {
                this.screenHistory = this.screenHistory.slice(0, -1);
                this.screen = this.screenHistory[
                    this.screenHistory.length - 1
                ];
            }
        },
    },
};

const ModAppStyles = `
.kos-timetable-mod-gui {
    width: 400px;
    position: fixed;
    bottom: 25px;
    right: 25px;
    background-color: white;
    border: 2px solid #0065bd;
}
.mod-gui-screen {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px;
}
.mod-gui-screen > div {
    width: 100%;
}
.mod-selectable-list {
    height: 200px;
    overflow: auto;
}
.mod-button-group {
    display: flex;
    flex-direction: row;
}
.mod-button-group > * {
    flex: 1;
}
.w100 {
    width: 100%;
}
.fs18 {
    font-size: 18px;
}
.bld {
    font-weight: bold;
}
.mod-row {
    display: flex;
    flex-direction: row;
    width: 100%;
}
.mod-select-header {
    font-weight: bold;
}
.mod-color-detail {
    display: flex;
    flex-direction: row;
    align-items: center;
}
.mod-color-box {
    width: 1em;
    height: 1em;
    margin-right: 0.25em;
}
`;

class ModGui {
    constructor() {}

    /* cannot await asynchronous calls in constructor */
    static async create() {
        const that = new ModGui();
        that.api = new ModApi();
        that.app = await ModGui.createApp(ModApp);
        that.app.provide('api', that.api);

        that.guiStylesheet = document.createElement('style');
        that.guiStylesheet.innerHTML = ModAppStyles;
        document.head.appendChild(that.guiStylesheet);

        that._guiRootElement = document.createElement('div');
        that._guiRootElement.classList.add('kos-timetable-mod-gui');
        document.body.append(that._guiRootElement);

        that.app.mount(that._guiRootElement);
        return that;
    }

    static async createApp(config) {
        const vue = await SingleVue.getInstance();
        return vue.createApp(config);
    }
}
let gui = await ModGui.create();





















/************** DOCS/TESTS **************/

/* INITIAL SETUP */

// creates instance of API and parses existing tickets and their respective courses
const api = new ModApi()


/* STYLES API */

// accesses registered styles (lecture, seminar, ...)
api.getStyles()

// registers a new style
api.addStyle(class_name='sport', color_dark='#f02800', color_light='#fddde8')

// updates a style
api.updateStyle(class_name='sport', style => style.color_dark = '#f00028')

// removes a style
api.removeStyle(class_name='someotherclass')


/* COURSES API */

// accesses registered courses
api.getCourses()

// registers a course to add tickets to
api.addCourse(official_name='BI-TV1', display_name='Tenis')

// official_name serves as an ID, i.e. the below call throws an error
try {
    api.addCourse(official_name='BI-TV1', display_name='Volejbal')
} catch (error) {}

// changes the display name for a course
api.updateCourse(official_name='BI-TV1', course => course.display_name='Volejbal')

// removes a course and all associated tickets
api.removeCourse(official_name='BI-MA2.21')


/* TICKETS API */

// accesses all tickets
api.getTickets()

// adds a ticket for a course

let newTicket = api
    .createTicketWhich
    .belongsToCourse('BI-TV1')
    .hasStyle('sport')
    .takesPlaceAtTime({
        day: 0,
        begin_hour: 20,
        begin_minute: 30,
        end_hour: 22,
        end_minute: 00
    }, KosWeekParity.all_weeks)
    .takesPlaceAtLocation({
        general: 'Juliska &mdash; ',
        specific: 'Modrá těl.'
    })
    .hasParallelCode('VOL07')
    .isTaughtBy('Markéta Kašparová')

let id = api.addTicket(newTicket)

// updates a ticket based on id
api.updateTicket(id, event => event.location.specific = 'Hala')

// removes a ticket based on id
api.removeTicket(id)
