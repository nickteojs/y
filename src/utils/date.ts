const currentDay = new Date().getDate();
const currentMonth = new Date().getMonth();
const currentYear = new Date().getFullYear();
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul","Aug", "Sep", "Oct", "Nov", "Dec"];
const currentHour = new Date().getHours();
const currentMins = new Date().getMinutes();

export const dateConstructor = (): string => {
    let hourMinString;
    if (currentHour > 12) {
        hourMinString = `${currentHour - 12}:${currentMins} PM`;
    } else hourMinString = `${currentHour}:${currentMins} AM`;
    return `${hourMinString} • ${months[currentMonth]} ${currentDay}, ${currentYear}`
}