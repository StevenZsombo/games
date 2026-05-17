//name of the spire map file, must be in spire/questions
//sample format: "spire.json"
//the quotation marks must be present
window.___spire =
    "spire.json"

//name of the hydra bossfight map file, must be in spire/questions
//sample format: "heads.json"
//the quotation marks must be present
window.___heads =
    "heads.json"

//list of students names
//sample format: "Alice,Bob,Jackie Chan"
//the quotaation marks must be present, and names are separated by a comma
window.___students =
    "Aziz,Darren,Blake,Vamsi,Steven,Fritz,Alain,other1,other2"

//number of minutes available for each head in order. the last one repeats infinitely
//sample format: "7,5,3"
//the quotation marks must be present, and numbers are separated by a comma
//decimals are okay too, e.g. "7,4.5,3" has four and a half minutes for the second head
window.___minutes =
    "7,5,3"

//anticheat to be used. must be either "off", "warn" or "punish"
//sample format: "punish"
//"off" will fully disable, "warn" will paint the screen in red and notify the server,
//"punish" will block all interactions for 30 seconds and notify the server
window.___anticheat =
    "warn"

