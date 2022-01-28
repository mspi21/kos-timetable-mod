
/**
 * Resizes the rows of the schedule to the numbers given in the parameter.
 * 
 * @param {Array[number]} heights array of (5) numbers specifying the relative height (1 = height of one ticket) of each row 
 * @returns whether or not the parameter is ok (doesn't check actual resizing success)
 */
const setRowHeights = function(heights)
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
    {
        for(i = 0; i < 5; i++)
        {
            gridColumn.children[i].style = `height: calc(var(--row-height) * ${heights[i]});`;
        }
    }
    
    return true;
};

/**
 * Adds a new ticket to the schedule. Note that ticketPlaceGeneral and ticketPlaceSpecific will simply
 * be concatenated together.
 * 
 * @param {string} className can be 'lecture', 'seminar', 'laboratory' or any other custom class name
 * @param {number} ticketDayOfWeek day of week, 0 = monday, ..., 4 = friday
 * @param {number} evenOrOddWeeksOnly 0 for every week, 1 for odd, 2 for even weeks only
 * @param {string} ticketTime time of class in the exact format "HH:MM - HH:MM" (24H)
 * @param {string} ticketName name of the subject, e.g. "BI-PA2.21" or "BI-LUNCH"
 * @param {string} ticketTeacher name of the teacher
 * @param {string} ticketPlaceGeneral the building where the class takes place (e.g. "TH-A:")
 * @param {string} ticketPlaceSpecific the classroom number/code (e.g. "PU1" or "349")
 * @param {number} offsetTop offset from the top (for rows with height >= 1)
 */
const addTicket = function(className, ticketDayOfWeek, evenOrOddWeeksOnly, ticketTime, ticketName, ticketTeacher, ticketPlaceGeneral, ticketPlaceSpecific, offsetTop)
{

};

/**
 * 
 * @param {string} className css-compatible class name (unique if possible)
 * @param {*} borderColour colour for the left border of the ticket (as seen in the official schedules)
 * @param {*} backgroundColour background colour for the ticket
 */
const addClass = function(className, borderColour, backgroundColour)
{
    // this will be interesting
};
