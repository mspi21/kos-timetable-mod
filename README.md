# KOS Schedule Mod

This is a mod for the (new) KOS schedule website.

It creates a small GUI that allows you to **customise your schedule** in various ways, including renaming your courses, changing colours, adding new events, styles, etc.

Besides that, it also exposes an API class that allows you to do all of the mentioned things programatically from the browser console.

## Basic Usage

Because this is a client-side add-on, it can only be run manually by the user by entering code in the developer console. The console is available in most desktop browsers like Firefox and Chrome.

> **Disclaimer**: It is generally unsafe to paste any code that you do not trust into your developer console, as that can result in a [Self-XSS attack](https://en.wikipedia.org/wiki/Self-XSS). Always make sure you understand the contents of the code you're running in your browser.

To use the mod:

1. Download the file named `ktm-v2.js` or view its raw contents on Github.
2. Open the [New KOS schedule website](https://new.kos.cvut.cz/schedule) and sign in with your CTU credentials.
3. While on the page, open the Javascript developer console in your browser by right clicking on the page, selecting 'Inspect' and switching to the 'Console' tab, or by pressing `{Ctrl | Super | Command}+Shift+C`.
4. Copy the contents of the file to the developer console (this may require confirmation, see the disclaimer above) and press `Return`.
5. You should now see the mod GUI in the bottom-right corner of your screen. To close and reopen the GUI, type `gui.close()` and `gui.open()` respectively into the console.

The `gui` variable created on the last line of the script is an object managing the whole gui app.

To use the API directly without the GUI, either access the `api` property on the `gui` object, or create your own instance by constructing a `ModApi` object:

```js
gui.api // access instance used by GUI
let api = new ModApi(); // create new instance
```

## Persistence

Note that all of the edits you make to the table are **rendered on the client-side only, purely visual and temporary!** The goal of this mod (for now) is merely to allow you to display or print your schedule in a way that looks nice.

Features to export / load the modified schedule using JSON or enable storing the edits in `localStorage` might be implemented in the future.

## Using the GUI

### Courses tab

A course defines the name shown on schedule tickets, e.g. 'BI-PA1.21' or 'Volleyball'.

The courses tab shows individual courses you've signed up for. It allows you to edit the display names for existing courses and add new courses. You can only create tickets for courses that are shown in this tab.

Despite being called a course, this entity can be any other user-defined event, such as daily exercise or work schedule event.

### Adding a course

|Input|Required|Description|
|-----|--------|-----------|
|Unique Code|yes|Official code for the course. Interally used as an id for the course, therefore multiple instances with the same code cannot exist.|
|Display Name|no|The name of the course to display on the schedule.|

## Styles tab

A style is a named combination of a background colour and an accent colour.

The styles tab gives you an overview of ticket styles that can be used. The default are 'lecture' (orange), 'seminar' (green), 'laboratory' (blue) and 'conflict' (red).

Changing an existing style automatically updates relevant tickets.

### Adding a style

|Input|Required|Description|
|-----|--------|-----------|
|Id|yes|Unique id for the style. Must be a CSS compatible class name.|
|Background Colour|yes|The background colour of the ticket element.|
|Accent Colour|yes|The colour of the ticket border.|

## Ticket tab

A ticket is a single element representing a class (lecture, seminar, ...) taken at a specific time. Each ticket represents, so to speak, a 'rectangle' on the schedule.

### Adding a ticket

|Input|Required|Description|
|-----|--------|-----------|
|Course|yes|The course this ticket belongs to. If this is a non-official course, it has to be added in the Courses tab.|
|Style|yes|The style (colours) to use for this ticket. Has to be defined in the Styles tab.|
|Day & Time|yes|Self-explanatory.|
|Location|no|'General' location and 'specific' location are simply two strings which will be concatenated together (**not separated by whitespace**) with the latter being rendered in bold.|
|Parallel Code|no|The code shown on the upper-right corner of a ticket.|
|Teacher|no|A string shown on the second row of the ticket, by default containing the name of the teacher.|

### Editing tickets

Currently, the course and the style of a ticket cannot be changed. This might be added in a future version.

## Save & Load JSON

Not implemented yet.

## API Documentation

### constructor

The constructor takes no arguments. An error is thrown if the schedule root element is not found.

It automatically parses any tickets which are already present in the schedule.

```js
const api = new ModApi();
```

### #getStyles()

Returns an array of registered styles.

```js
api.getStyles();
// returns
[
    {id: "lecture", color_dark: "#F0AB00", color_light: "#fceecc"},
    ...
]
```

### #addStyle(class_name, color_dark, color_light)

Registers a new style.

```js
api.addStyle('sport', '#dfeedf', '#70c070');
```

### #updateStyle(class_name, fn_update)

Updates a style.

```js
api.updateStyle('sport', style => {
    style.color_light = '#dfdfee';
    style.color_dark = '#7070c0';
});
```

### #removeStyle(class_name)

Removes a style. The removed style must not be used by any registered tickets.

```js
api.removeStyle('sport');
```

### #getCourses()

Returns an array of registered courses.

```js
api.getCourses();
// returns
[
    {official_name: "TV1", display_name: "Volleyball"},
    ...
]
```

### #addCourse(official_name, display_name?)

Registers a new course.

```js
api.addCourse('BI-PA1.21');
api.addCourse('BI-PA2.21', 'C++ Programming');
```

### #updateCourse(official_name, fn_update)

Updates a course (currently only its display name).

```js
api.updateStyle('BI-PA2.21', course => {
    course.display_name = 'C++ Happiness';
});
```

### #removeCourse(official_name)

Removes a course along with all its tickets.

```js
api.removeCourse('BI-MA2.21');
```

### #getTickets()

Returns an array of registered tickets.

```js
api.getTickets();
// returns
[
    {
        id: "12345-abcde",
        added_by_user: false,
        course_event: {
            course: {...}, // course object
            style: {...}, // style object
            time_of_week: {
                begin_hour: 9,
                begin_minute: 15,
                day: 0,
                end_hour: 10,​​​
                end_minute: 45
            },
            location: {
                general: "TK:",
                specific: "BS"
            },
            parallel: "1P",
            teacher: "XYZ"
        },
        element: <div>...</div>, // ticket element
        root: <div>...</div> // schedule root
    },
    ...
]
```

### #addTicket(ticket_builder)

Adds a new ticket configured with a `TicketBuilder`, which is a helper class equipped with the following methods to make constructing tickets easier.

> Note: `api.createTicketWhich` gets an instance of a `TicketBuilder` which is configured and then passed as an argument to `api.addTicket`.

```js
const configuredTicket = api.createTicketWhich
    .belongsToCourse('BI-PA1.21') // must be called
    .hasStyle('laboratory') // must be called
    .takesPlaceAtTime({
        day: KosDayOfWeek.friday,
        begin_hour: 16,
        begin_minute: 15,
        end_hour: 17,
        end_minute: 45
    }, KosWeekParity.all_weeks) // must be called
    .takesPlaceAtLocation({
        general: 'T9:',
        specific: '350'
    }) // optional
    .hasParallelCode('20L') // optional
    .isTaughtBy('XYZ'); // optional

api.addTicket(configuredTicket);
// returns ticket id
'12345-abcde'
```

### #updateTicket(id, fn_update)

Updates ticket details. Internally, the update function is called on the `course_event` property of the ticket object, **not the ticket object itself**!

```js
api.updateTicket('12345-abcde', event => {
    event.time_of_week.day = KosDayOfWeek.thursday;
    event.location.specific = '349';
    event.teacher = 'John Doe';
    ...
});
```

### #removeTicket(id)

Removes a ticket.

```js
api.removeTicket('12345-abcde');
```

## Missing features / limitations

- Currently, the mod does not detect overlapping tickets and therefore does not adjust row heights. This should be fixed in the next release.
- Switching between semesters is not supported.
- Currently, the course and the style of a ticket cannot be changed. This might be added in a future version.