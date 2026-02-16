
console.log('Quickslot starting')

// api's
const rosterUrl = "https://jsonplaceholder.typicode.com/users?_limit=10";
// Fake API to fetch 10 random providers

const clockUrl = "https://worldtimeapi.org/api/timezone/Asia/Kolkata";
// Real time API to sync with internet clock (IST)



// Global state to hold app data
const state = {
    providers: [],
    nowUtc : null,
    bookings : [],
    pendingSlot: null
}

// bookings LocalStorage key
const BOOKINGS_STORAGE_KEY = 'quickSlot_bookings'

// DOM elements selection


// function to readBookings
function readBookings(){

    //  get data from local storage. it data doesnot exist in local storage -> initialize the bookings state to empty array.
    // state.confirmedBookings = JSON.parse( localStorage.getItem(BOOKINGS_STORAGE_KEY)  ) || []

    try {
        state.bookings = JSON.parse( localStorage.getItem(BOOKINGS_STORAGE_KEY) || '[]' ) 
    } 
    catch (error) {
        state.bookings = []
        console.log(error)
    }
}

// function to saveBookings
function saveBookings(){
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(state.bookings) )
}

/*   Test

    state.bookings.push({test: 'hello'})
    console.log(state.bookings)
    saveBookings()

*/

// function to fetch provider form api
async function fetchProviders(){
     
    try {
        const res = await fetch(rosterUrl)

        // manually check is response is 'Ok'
        if ( !res.ok ){
            throw new Error(`Failed to fetch providers: ${res.status}`)
        }

        const data = await res.json()
        // console.log(data)

        state.providers = data.map(p =>{

            let provider = {
                id : p.id,
                name: p.name,
                specialty: p.company.bs,
                city: p.address.city

            }

            return provider
        })
    } 
    catch (error) {
        state.providers = []
        console.error(error)
    }
    console.log('All providers: ', state.providers)
}

// function to render providers list




// main function -> init()
async function init(){
    readBookings()
    console.log('app Started, bookings: ', state.bookings)
    await fetchProviders()

}


// runs automatically when page loads
document.addEventListener("DOMContentLoaded", ()=>{
    init()
})