# KOS Timetable Mod

The new KOS Timetable looks nice, doesn't it? Wouldn't it be nice to be able to add all of your other subjects (such as Physical Ed, classes you've swapped, regular activities from outside the class) to your existing timetable and print it out in one single format?

**Well, that's what this javascript class helps you to do!**

## Disclaimer

Note that all of the edits you make to the table are **client-side only, purely visual and temporary!** The goal of this mod (for now) is merely to allow you to _print_ your schedule in a way that looks nice.

## Usage

The idea is that you copy the contents of the file above, paste it into the javascript console in your browser and then use a couple simple methods to manipulate the timetable.

### Adding simple tickets

Let's say your timetable looks like this:

![image](https://user-images.githubusercontent.com/78057064/151667773-7ffa81e0-412c-4652-9cab-117ca9e7182b.png)

In order to add any new tickets, first create a new instance of TimetableMod and set your locale (CZ/EN):
```js
let tm = new TimetableMod(TimetableMod.LOCALE_CZ);
//       feel free to use TimetableMod.LOCALE_EN
```

Let's say you want to add a lecture, seminar or laboratory without adding a custom style (maybe a seminar that you are taking at CTU but which for whatever reason does not appear in your regular timetable). For instance, let's add a BI-GIT.21 seminar taking place every Friday from 16:15 until 17:45.

```js
tm.addTicket("seminar", TimetableMod.FRIDAY, TimetableMod.WEEKS_ALL, "16:15 - 17:45", "1C", "BI-GIT.21", "Petr Pulc (+1)", "T9:", "105", 0);
```
![image](https://user-images.githubusercontent.com/78057064/151668158-22696186-7340-46da-a7bf-e86777401874.png)

Great, that was a success. For details about each parameter, see [the docs](#documentation).

Say that now you wanted to add a slot for your morning jog that you take on every odd Thursday at 7:30. The first problem you will run into is that every row of the timetable is just "one high", i.e. you can't easily add a ticket at the same place where you already have a class on the even weeks.

We can fix that using the following function:
```js
tm.setRowHeights([1,1,1,2,1]);
```

The table now looks like this and we can add another class at 7:30.

![image](https://user-images.githubusercontent.com/78057064/151668443-7f35ffe9-e603-43f9-bd16-84b25fb8b9e5.png)

### Adding conflicting tickets and custom colours

To add a class with a "ODD" (or "EVEN") week designation, utilise the third parameter of the addTicket method:

```js
tm.addTicket("jogging-in-the-morning", TimetableMod.THURSDAY, TimetableMod.WEEKS_ODD, "7:30 - 9:00", "", "My biweekly jog", "", "Praha 7, ", "Stromovka", 1);
```
![image](https://user-images.githubusercontent.com/78057064/151668556-ab7bcf1c-66a9-434c-910d-a58f224f2e1e.png)

Notice how we set the last parameter (`offsetTop`) from `0` to `1` so that the ticket appears in the second row of Thursday. Also notice that the ticket works fine even if you omit certain information, such as the name of the teacher or the parallel number. Lastly, as you may notice, we didn't use one of the standard four element classes that come with the KOS schedule: `lecture`, `seminar`, `laboratory` and `conflict`. TimetableMod gives you the ability to add custom classes using yet another method:

```js
tm.addClassStyle("jogging-in-the-morning", 320);
```
![image](https://user-images.githubusercontent.com/78057064/151668996-b7e7eaf2-9404-46bf-b335-1a025be65b23.png)

Here the second parameter is the hue of the colour that you wish to associate with the class, for example, 0 would be red, 220 dark blue, 320 light purple.
If you wish to specify the background colour and the accent colour directly, see method `__addClassStyleInternal` in [the docs](#documentation).

### Listing and removing tickets

You can access all the tickets that you've added using `tm.addedTickets`. To easily delete the second ticket that you added, use
```js
tm.deleteTicket(tm.addedTickets[1]);
```

### Printing

When you are done editing your timetable, feel free to press "Print Schedule" on the website and all your changes will carry over to the PDF.

## Documentation

### constructor
The constructor takes one parameter, the `locale`. This is only used for even / odd week designation, but is required nonetheless.

**Accepted values** (equivalent):
|constant               |value|
|:---------------------:|:---:|
|TimetableMod.LOCALE_CZ |"CZE"|
|TimetableMod.LOCALE_EN |"ENG"|

### addedTickets
Array of DOM elements added by TimetableMod. Useful to quickly access and/or delete created tickets.

### hyphensToNdashes()
Simply changes all timespan text from "HH:MM - HH:MM" to "HH:MM&ndash;HH:MM", just like it _should_ be.

### setRowHeights(heights)
Resizes the rows of the schedule to the numbers given in the parameter.

**Parameters**
|name       |type            |description                                  |
|:---------:|:--------------:|:-------------------------------------------:|
|heights    |Array\<number\>[5]|array containing numbers of rows for each day| 

**Returns**: `true` if parameter is ok, `false` otherwise

### addTicket(className, ticketDayOfWeek, evenOrOddWeeksOnly, ticketTime, parallelNumber, ticketName, ticketTeacher, ticketPlaceGeneral, ticketPlaceSpecific, offsetTop)
Adds a new ticket to the schedule. Note that `ticketPlaceGeneral` and `ticketPlaceSpecific` will simply be concatenated together with the latter being rendered in **bold**.

**Parameters**
|name               |type  |description                                                                 |
|:-----------------:|:----:|:--------------------------------------------------------------------------:|
|className          |string|can be 'lecture', 'seminar', 'laboratory' or any other custom class name    |
|ticketDayOfWeek    |number|day of week, 0-4 or static constants can be used (e.g. TimetableMod.MONDAY) |
|evenOrOddWeeksOnly |number|one of TimetableMod.WEEKS_ALL, Timetable.WEEKS_ODD, Timetable.WEEKS_EVEN    |
|ticketTime         |string|time of class in this exact format: "(H)H:MM - (H)H:MM" (24H)               |
|parallelNumber     |string|code used to designate the parallel (e.g. "107C" or "1P"), can be left empty|
|ticketName         |string|name of the subject, e.g. "BI-PA2.21" or "BI-LUNCH"                         |
|ticketTeacher      |string|name of the teacher or any other information appearing under the class name |
|ticketPlaceGeneral |string|the building where the class takes place (e.g. "TH-A:")                     |
|ticketPlaceSpecific|string|the classroom number/code (e.g. "PU1" or "349")                             |
|offsetTop          |number|offset from the top (for rows with height > 1)                             |

**Returns**: `void`

### removeTicket(ticket)
Removes a ticket from the DOM tree as well as from `addedTickets`.

|name  |type      |description              |
|:----:|:--------:|:-----------------------:|
|ticket|DOMElement|the element to be deleted|

**Returns**: `true` if element was found in `addedTickets` and deleted, `false` otherwise

### addClassStyle(className, colourHue)
Adds a class name to be used in `addTicket` instead of standard `lecture`, `seminar`, `laboratory` and `conflict`.

_Note_: if you don't want me to automatically generate colours based on a single hue, feel free to use the method `__addClassStyleInternal(className, borderColour, backgroundColour)`.

|name     |type  |description                                   |
|:-------:|:----:|:--------------------------------------------:|
|className|string|css-compatible class name (unique if possible)|
|colourHue|number|colour (hue) to use for this class (0-360)    |

### __addClassStyleInternal(className, borderColour, backgroundColour)
Adds a class name rule, specifying both the border (accent) colour and the background colour to use.

|name            |type  |description                                   |
|:--------------:|:----:|:--------------------------------------------:|
|className       |string|css-compatible class name (unique if possible)|
|borderColour    |string|css-compatible colour value (Hex, RGB, HST...)|
|backgroundColour|string|css-compatible colour value (Hex, RGB, HST...)|
