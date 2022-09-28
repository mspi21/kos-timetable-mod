const generateUUID = () => {
    //#Source: https://bit.ly/2neWfJ2 
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(
        /[018]/g, c => (
            c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
        ).toString(16)
    )
};

const KosWeekParity = Object.freeze({
    all_weeks: '',
    odd_weeks: 'Lichý',
    even_weeks: 'Sudý'
});

const KosDayOfWeek = Object.freeze({
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4
});

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const kosTimeToString = ({ begin_hour, begin_minute, end_hour, end_minute}) => {
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
};

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
        ticket_wrapper.classList.add('ticket-wrapper', course_event.style.id)
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
        th_overflow_hidden.innerText = kosTimeToString(course_event.time_of_week);
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
            course_event.style.id === 'lecture' && base_box.classList.add('P')
            course_event.style.id === 'seminar' && base_box.classList.add('C')
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
            },
            {
                id: 'laboratory',
                color_dark: '#6AADE4',
                color_light: '#e6f4ff'
            },
            {
                id: 'conflict',
                color_dark: '#C60C30',
                color_light: '#f9e7ea'
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
                style: this._styles.find(s => s.id === element.querySelector('.ticket-wrapper').classList.item(1)),
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
        this._tickets.filter(predicate).forEach(ticket => ticket.refreshDom());
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
        this._refreshTickets(ticket => ticket.course_event.style.id === class_name)
    }

    updateStyle(class_name, fn_update) {
        const style = this._styles.find(s => s.id === class_name)
        if(!style)
            throw new Error(`Could not find a style with name '${class_name}.'`)
        fn_update(style)
        this._refreshTickets(ticket => ticket.course_event.style.id === class_name)
    }

    removeStyle(class_name) {
        // only allow removing a style if no tickets are using it
        this._tickets.forEach(t => {
            if(t.course_event.style.id === class_name)
                throw new Error(
                    `Style ${class_name} is used by ticket (Course ${t.course_event.course.official_name}, ` +
                    `${DAY_NAMES[t.course_event.time_of_week.day]} ${kosTimeToString(t.course_event.time_of_week)}).\n` +
                    `Cannot remove style that is in use.`
                );
        });

        this._styles = this._styles.filter(s => s.id !== class_name)
        this._refreshTickets(ticket => ticket.course_event.style.id === class_name)
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
        this._courses = this._courses.filter(c => c.official_name !== official_name);

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
        this._course_event = {
            course: {},
            style: {},
            location: {},
            time_of_week: {},
            teacher: '',
            weekParity: KosWeekParity.all_weeks
        }
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
            throw new Error(`Could not find a course with official name '${course_name}.'`)
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
                scriptEl.setAttribute('src', 'https://unpkg.com/vue@3/dist/vue.global.prod.js');
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
        disabled: {
            type: Boolean,
            default: false
        }
    },
    emits: ['click'],
    template: `
        <button
            class="btn button-container btn-primary btn-md button-component w100"
            :disabled="disabled"
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
                        <input type="radio" :name="id" :value="option.id" @input="$emit('select', option.id)"></input>
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
        <div class="bld fs18">
            Kos Schedule Mod v2
        </div>
        <div>
            Use below options to add, edit or remove courses, styles and tickets.
            For more detailed documentation see the <a target="_blank" href="https://github.com/mspi21/kos-timetable-mod">GitHub repository</a>.
        </div>
        <div><v-button text="Courses" @click="$emit('setscreen', {screen: CoursesScreenComponent})" /></div>
        <div><v-button text="Styles" @click="$emit('setscreen', {screen: StylesScreenComponent})" /></div>
        <div><v-button text="Tickets" @click="$emit('setscreen', {screen: TicketsScreenComponent})" /></div>
        <div class="mod-button-group">
            <v-button disabled text="Save to JSON" />
            <v-button disabled text="Load JSON" />
        </div>
        <div>Author <a href="mailto:spinkmil@fit.cvut.cz">@spinkmil</a> (<a target="_blank" href="https://github.com/mspi21">github.com/mspi21</a>)</div>
    </div>
    `,
    components: {
        "v-button": ButtonComponent,
    }
};

const CoursesScreenComponent = {
    inject: ['api'],
    data() {
        return {
            AddCourseScreenComponent,
            EditCourseScreenComponent,
            courses: [],
            selectedCourseId: null,
        };
    },
    methods: {
        refreshCourses() {
            this.courses = this.api.getCourses().map(c => ({
                id: c.official_name,
                'Official Name': c.official_name,
                'Display Name': c.display_name || '-'
            }));
        },
        setSelectedCourse(id) {
            this.selectedCourseId = id;
        },
        removeSelectedCourse() {
            this.api.removeCourse(this.selectedCourseId);
            this.selectedCourseId = null;
            this.refreshCourses();
        }
    },
    computed: {
        hasSelectedCourse() {
            return this.selectedCourseId !== null;
        }
    },
    mounted() {
        this.refreshCourses();
    },
    template: `
    <div class="mod-gui-screen">
        <div class="bld fs18">Courses</div>
        <div>
            <v-selectable-list id="select_course" :options="courses" @select="setSelectedCourse($event)">
            </v-selectable-list>
        </div>
        <div class="mod-button-group">
            <v-button text="Add course" @click="$emit('setscreen', {screen: AddCourseScreenComponent})" />
            <v-button :disabled="!hasSelectedCourse" text="Edit course" @click="$emit('setscreen', {
                screen: EditCourseScreenComponent,
                props: {
                    courseId: selectedCourseId
                }
            })" />
            <v-button :disabled="!hasSelectedCourse" text="Remove course" @click="removeSelectedCourse" />
        </div>
        <div><v-button text="Go Back" @click="$emit('goback')" /></div>
    </div>
    `,
    emits: ['setscreen', 'goback'],
    components: {
        "v-button": ButtonComponent,
        "v-selectable-list": SelectableListComponent,
    },
};

const AddCourseScreenComponent = {
    inject: ['api'],
    data() {
        return {
            courseId: '',
            courseDisplayName: '',
            error: '',
        };
    },
    methods: {
        save() {
            if(this.api.getCourses().some(c => c.official_name === this.courseId)) {
                this.showError(`There is already a course with code '${this.courseId}'.`);
                return;
            }
            this.api.addCourse(this.courseId, this.courseDisplayName);
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
    <div class="mod-gui-screen mod-error" v-if="error">
        <div>{{ error }}</div>
        <v-button text="Dismiss" @click="dismissError" />
    </div>
    <div class="mod-gui-screen" v-else>
        <div class="bld fs18">Add New Course</div>
        <table style="width: 100%;">
            <thead></thead>
            <tbody>
                <tr>
                    <td>Unique Code</td>
                    <td><input class="w100" type="text" v-model="courseId"></input></td>
                </tr>
                <tr>
                    <td>Display Name</td>
                    <td><input class="w100" type="text" v-model="courseDisplayName"></input></td>
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

const EditCourseScreenComponent = {
    inject: ['api'],
    props: ['courseId'],
    data() {
        return {
            courseDisplayName: '',
        };
    },
    methods: {
        save() {
            this.api.updateCourse(this.courseId, (course) => {
                course.display_name = this.courseDisplayName;
            });
            this.$emit('goback');
        },
    },
    template: `
    <div class="mod-gui-screen" v-else>
        <div class="bld fs18">Edit course '{{ courseId }}'</div>
        <table style="width: 100%;">
            <thead></thead>
            <tbody>
                <tr>
                    <td>Display Name</td>
                    <td><input class="w100" type="text" v-model="courseDisplayName"></input></td>
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

const StylesScreenComponent = {
    inject: ['api'],
    data() {
        return {
            AddStyleScreenComponent,
            EditStyleScreenComponent,
            styles: [],
            selectedStyleId: null,
            error: '',
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
            try {
                this.api.removeStyle(this.selectedStyleId);
                this.selectedStyleId = null;
                this.refreshStyles();
            }
            catch(e) {
                this.showError(e);
            }
        },
        showError(e) {
            this.error = e.message;
        },
        dismissError() {
            this.error = '';
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
    <div class="mod-gui-screen mod-error" v-if="error">
        <div>{{ error }}</div>
        <v-button text="Dismiss" @click="dismissError" />
    </div>
    <div class="mod-gui-screen" v-else>
        <div class="bld fs18">Styles</div>
        <div>
            <v-selectable-list id="select_style" :options="styles" @select="setSelectedStyle($event)">
            </v-selectable-list>
        </div>
        <div class="mod-button-group">
            <v-button text="Add style" @click="$emit('setscreen', {screen: AddStyleScreenComponent})" />
            <v-button :disabled="!hasSelectedStyle" text="Edit style" @click="$emit('setscreen', {
                screen: EditStyleScreenComponent,
                props: {
                    styleId: selectedStyleId
                }
            })" />
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
    <div class="mod-gui-screen mod-error" v-if="error">
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

const EditStyleScreenComponent = {
    inject: ['api'],
    props: ['styleId'],
    data() {
        return {
            colorLight: '',
            colorDark: '',
        };
    },
    methods: {
        save() {
            this.api.updateStyle(this.styleId, (style) => {
                style.color_dark = this.colorDark;
                style.color_light = this.colorLight;
            });
            this.$emit('goback');
        },
    },
    mounted() {
        const s = this.api.getStyles().find(s => s.id === this.styleId);
        this.colorLight = s.color_light;
        this.colorDark = s.color_dark;
    },
    template: `
    <div class="mod-gui-screen" v-else>
        <div class="bld fs18">Edit style '{{ styleId }}'</div>
        <table style="width: 100%;">
            <thead></thead>
            <tbody>
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
    inject: ['api'],
    data() {
        return {
            AddTicketScreenComponent,
            EditTicketScreenComponent,
            tickets: [],
            selectedTicketId: null,
        };
    },
    methods: {
        refreshTickets() {
            this.tickets = this.api.getTickets().map(t => ({
                id: t.id,
                'Course': t.course_event.course.official_name,
                'Day': DAY_NAMES[t.course_event.time_of_week.day],
                'Time': kosTimeToString(t.course_event.time_of_week)
            }));
        },
        setSelectedTicket(id) {
            this.selectedTicketId = id;
        },
        removeSelectedTicket() {
            this.api.removeTicket(this.selectedTicketId);
            this.selectedTicketId = null;
            this.refreshTickets();
        }
    },
    computed: {
        hasSelectedTicket() {
            return this.selectedTicketId !== null;
        }
    },
    mounted() {
        this.refreshTickets();
    },
    template: `
    <div class="mod-gui-screen">
        <div class="bld fs18">Tickets</div>
        <div class="mod-list-container">
            <v-selectable-list id="select_ticket" :options="tickets" @select="setSelectedTicket($event)">
            </v-selectable-list>
        </div>
        <div class="mod-button-group">
            <v-button text="Add ticket" @click="$emit('setscreen', {screen: AddTicketScreenComponent})" />
            <v-button :disabled="!hasSelectedTicket" text="Edit ticket" @click="$emit('setscreen', {
                screen: EditTicketScreenComponent,
                props: {
                    ticketId: selectedTicketId
                }
            })"/>
            <v-button :disabled="!hasSelectedTicket" text="Remove ticket" @click="removeSelectedTicket" />
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

const AddTicketScreenComponent = {
    inject: ['api'],
    data() {
        return {
            courses: [],
            styles: [],
            daysOfWeek: DAY_NAMES,
            weekParityOptions: [
                { text: 'Odd Weeks', value: KosWeekParity.odd_weeks },
                { text: 'Even Weeks', value: KosWeekParity.even_weeks },
                { text: 'Every Week', value: KosWeekParity.all_weeks },
            ],
            error: '',
            // required
            courseId: '',
            beginHour: 0,
            beginMinute: 0,
            endHour: 0,
            endMinute: 0,
            dayOfWeek: 0,
            styleId: '',
            // optional
            locationGeneral: '',
            locationSpecific: '',
            parallelCode: '',
            teacherName: '',
            weekParity: KosWeekParity.all_weeks
        };
    },
    methods: {
        checkRequiredFields() {
            if(!this.courseId) {
                throw new Error('You must select a course.');
            }
            if(!this.styleId) {
                throw new Error('You must select a style.');
            }
        },
        save() {
            try {
                this.checkRequiredFields();
                const ticket = this.api.createTicketWhich
                    .belongsToCourse(this.courseId)
                    .takesPlaceAtTime({
                        day: this.dayOfWeek,
                        begin_hour: this.beginHour,
                        begin_minute: this.beginMinute,
                        end_hour: this.endHour,
                        end_minute: this.endMinute,
                    }, this.weekParity || KosWeekParity.all_weeks)
                    .hasStyle(this.styleId);
                if(this.locationGeneral || this.locationSpecific)
                    ticket.takesPlaceAtLocation({general: this.locationGeneral, specific: this.locationSpecific});
                if(this.parallelCode)
                    ticket.hasParallelCode(this.parallelCode);
                if(this.teacherName)
                    ticket.isTaughtBy(this.teacherName);

                this.api.addTicket(ticket);
                this.$emit('goback');
            }
            catch(e) {
                this.showError(e.message);
            }
        },
        showError(e) {
            this.error = e;
        },
        dismissError() {
            this.error = '';
        }
    },
    mounted() {
        this.courses = this.api.getCourses().map(c => c.official_name);
        this.styles = this.api.getStyles().map(s => s.id);
    },
    template: `
    <div class="mod-gui-screen mod-error" v-if="error">
        <div>{{ error }}</div>
        <v-button text="Dismiss" @click="dismissError" />
    </div>
    <div class="mod-gui-screen" v-else>
        <div class="bld fs18">Add New Ticket</div>
        <table style="width: 100%;">
            <thead></thead>
            <tbody>
                <tr>
                    <td>Course</td>
                    <td><select v-model="courseId" class="w100">
                        <option value="" disabled selected>Select a course...</option>
                        <option v-for="course in courses" :value="course">{{ course }}</option>
                    </select></td>
                </tr>
                <tr>
                    <td>Style</td>
                    <td><select v-model="styleId" class="w100">
                        <option value="" disabled selected>Select a style...</option>
                        <option v-for="style in styles" :value="style">{{ style }}</option>
                    </select></td>
                </tr>
                <tr>
                    <td>Day & Time</td>
                    <td>
                        <select class="w50" v-model="dayOfWeek">
                            <option v-for="(day, i) in daysOfWeek" :value="i" :selected="i === 0">{{ day }}</option>
                        </select>
                        <select class="w50" v-model="weekParity">
                            <option v-for="option in weekParityOptions" :value="option.value">{{ option.text }}</option>
                        </select>
                    </td>
                </tr>
                <tr>
                    <td></td>
                    <td>
                        <div class="mod-row">
                            <input class="w3em" type="number" v-model="beginHour" min="0" max="23"></input> : <input class="w3em" type="number" v-model="beginMinute" min="0" max="59"></input>
                            \u0020\u2013\u0020
                            <input class="w3em" type="number" v-model="endHour" min="0" max="23"></input> : <input class="w3em" type="number" v-model="endMinute" min="0" max="59"></input>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>Location</td>
                    <td>
                        <div class="mod-row">
                            <input type="text" class="w50" placeholder="General (normal)" v-model="locationGeneral"></input>
                            <input type="text" class="w50" placeholder="Specific (bold)" v-model="locationSpecific"></input>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>Parallel Code</td>
                    <td><input type="text" class="w100" placeholder="e.g. 1P" v-model="parallelCode"></input></td>
                </tr>
                <tr>
                    <td>Teacher</td>
                    <td><input type="text" class="w100" v-model="teacherName"></input></td>
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

const EditTicketScreenComponent = {
    inject: ['api'],
    props: ['ticketId'],
    data() {
        return {
            daysOfWeek: DAY_NAMES,
            weekParityOptions: [
                { text: 'Odd Weeks', value: KosWeekParity.odd_weeks },
                { text: 'Even Weeks', value: KosWeekParity.even_weeks },
                { text: 'Every Week', value: KosWeekParity.all_weeks },
            ],
            error: '',
            // required
            beginHour: 0,
            beginMinute: 0,
            endHour: 0,
            endMinute: 0,
            dayOfWeek: 0,
            // optional
            locationGeneral: '',
            locationSpecific: '',
            parallelCode: '',
            teacherName: '',
            weekParity: KosWeekParity.all_weeks
        };
    },
    methods: {
        save() {
            try {
                const updateFn = (course_event) => {
                    course_event.time_of_week = {
                        day: this.dayOfWeek,
                        begin_hour: this.beginHour,
                        begin_minute: this.beginMinute,
                        end_hour: this.endHour,
                        end_minute: this.endMinute,
                    };
                    course_event.week_parity = this.weekParity;

                    if(this.locationGeneral || this.locationSpecific)
                        course_event.location = {general: this.locationGeneral, specific: this.locationSpecific};
                    if(this.parallelCode)
                        course_event.parallel = this.parallelCode;
                    if(this.teacherName)
                        course_event.teacher = this.teacherName;
                };
                this.api.updateTicket(this.ticketId, updateFn);
                this.$emit('goback');
            }
            catch(e) {
                this.showError(e.message);
            }
        },
        showError(e) {
            this.error = e;
        },
        dismissError() {
            this.error = '';
        }
    },
    computed: {
        ticketTitle() {
            const courseEvent = this.api.getTickets().find(t => t.id === this.ticketId).course_event;
            return `${courseEvent.course.official_name} (${courseEvent.style.id})`;
        }
    },
    mounted() {
        const editedTicket = this.api.getTickets().find(t => t.id === this.ticketId).course_event;

        const { day, begin_hour, begin_minute, end_hour, end_minute } = editedTicket.time_of_week;
        this.dayOfWeek = day;
        this.beginHour = begin_hour;
        this.beginMinute = begin_minute;
        this.endHour = end_hour;
        this.endMinute = end_minute;
        this.weekParity = editedTicket.week_parity;
    
        this.locationGeneral = editedTicket.location.general;
        this.locationSpecific = editedTicket.location.specific;
        this.parallelCode = editedTicket.parallel;
        this.teacherName = editedTicket.teacher;
    },
    template: `
    <div class="mod-gui-screen mod-error" v-if="error">
        <div>{{ error }}</div>
        <v-button text="Dismiss" @click="dismissError" />
    </div>
    <div class="mod-gui-screen" v-else>
        <div class="bld fs18">Edit ticket for {{ ticketTitle }}</div>
        <table style="width: 100%;">
            <thead></thead>
            <tbody>
                <tr>
                    <td>Day & Time</td>
                    <td>
                        <select class="w50" v-model="dayOfWeek">
                            <option v-for="(day, i) in daysOfWeek" :value="i" :selected="i === 0">{{ day }}</option>
                        </select>
                        <select class="w50" v-model="weekParity">
                            <option v-for="option in weekParityOptions" :value="option.value">{{ option.text }}</option>
                        </select>
                    </td>
                </tr>
                <tr>
                    <td></td>
                    <td>
                        <div class="mod-row">
                            <input class="w3em" type="number" v-model="beginHour" min="0" max="23"></input> : <input class="w3em" type="number" v-model="beginMinute" min="0" max="59"></input>
                            \u0020\u2013\u0020
                            <input class="w3em" type="number" v-model="endHour" min="0" max="23"></input> : <input class="w3em" type="number" v-model="endMinute" min="0" max="59"></input>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>Location</td>
                    <td>
                        <div class="mod-row">
                            <input type="text" class="w50" placeholder="General (normal)" v-model="locationGeneral"></input>
                            <input type="text" class="w50" placeholder="Specific (bold)" v-model="locationSpecific"></input>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>Parallel Code</td>
                    <td><input type="text" class="w100" placeholder="e.g. 1P" v-model="parallelCode"></input></td>
                </tr>
                <tr>
                    <td>Teacher</td>
                    <td><input type="text" class="w100" v-model="teacherName"></input></td>
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

const ModApp = {
    template: `
        <component
            :is="screen"
            @setscreen="setScreen($event)"
            @goback="setPreviousScreen"
            v-bind="screenProps"
        ></component>
    `,
    components: {
        MainScreenComponent,
    },
    data() {
        return {
            screen: MainScreenComponent,
            screenProps: {},
            screenHistory: [{screen: MainScreenComponent, props: {}}],
        };
    },
    methods: {
        setScreen(component) {
            if(component) {
                this.screen = component.screen;
                this.screenProps = component.props || {};
                this.screenHistory.push({
                    screen: component.screen,
                    props: component.props
                });
            }
        },
        setPreviousScreen() {
            if(this.screenHistory.length > 1) {
                this.screenHistory = this.screenHistory.slice(0, -1);
                const {screen, props} = this.screenHistory[
                    this.screenHistory.length - 1
                ];
                this.screen = screen;
                this.screenProps = props;
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
.w50 {
    width: 50%;
}
.w3em {
    width: 3em;
}
.fs18 {
    font-size: 18px;
}
.bld {
    font-weight: bold;
}
.sp-btw {
    display: flex;
    justify-content: space-between;
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
.mod-list-container {
    max-height: 240px;
    overflow: auto;
}
.mod-error > div {
    background-color: #f9dccd;
    padding: 1em;
}
`;

class ModGui {
    constructor() {}

    /* cannot await asynchronous calls in constructor */
    static async create() {
        console.log('Creating mod GUI...');

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
        console.log(
            'Gui created. To close it, call the close() method.\n' +
            'The GUI can later be reopened using the open() method.'
        );
        return that;
    }

    static async createApp(config) {
        const vue = await SingleVue.getInstance();
        return vue.createApp(config);
    }

    close() {
        this._guiRootElement.style.display = 'none';
        console.log('Gui closed. To open it again, call the open() method.');
    }

    open() {
        this._guiRootElement.style.display = '';
        console.log('Gui reopened. To close it, call the close() method.');
    }
}

let gui = await ModGui.create();