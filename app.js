
console.log('Quickslot starting')

// api's
const rosterUrl = "https://jsonplaceholder.typicode.com/users?_limit=10";
// Fake API to fetch 10 random providers

const clockUrl = "https://time.now/developer/api/timezone/Asia/Kolkata";
// Real time API to sync with internet clock (IST)



// Global state to hold app data
const state = {
    providers: [],
    nowUtc : null,
    bookings : [],
    pendingSlot: null,
    target : null
}

// bookings LocalStorage key
const BOOKINGS_STORAGE_KEY = 'quickSlot_bookings'

// DOM elements selection
const statProvider = document.getElementById('statProviders')
const statBookings = document.getElementById('statBookings')
const statClock = document.getElementById('statClock')

const syncTime = document.getElementById('syncTime')

const providerInput = document.getElementById('providerInput')
const slotsGrid = document.getElementById('slotsGrid')
const fetch_Slots_Btn = document.getElementById('fetch_Slots_Btn')
const dateInput = document.getElementById('dateInput')

// function to readBookings
function readBookings(){

    //  get data from local storage. it data doesnot exist in local storage -> initialize the bookings state to empty array.
    // state.confirmedBookings = JSON.parse( localStorage.getItem(BOOKINGS_STORAGE_KEY)  ) || []

    try {
        state.bookings = JSON.parse( localStorage.getItem(BOOKINGS_STORAGE_KEY) || '[]' ) 

        // update statBookings UI
        statBookings.innerText = `${state.bookings.length}`  

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
function renderProviderSelect(){

    providerInput.innerHTML =`<option>Loading Roster...</option>`

    state.providers.forEach(p => {

        // console.log(p)
        
        const opt = document.createElement('option')
        opt.value = p.id
        opt.textContent = `${p.name} - ${p.specialty}`

        providerInput.appendChild(opt)

    });

    // render provider stat
    statProvider.innerText = `${state.providers.length}`

}


// fetch internet time using api and update the clock ui's
async function fetchNowUtc(){

    try {
        const res = await fetch(clockUrl)

        if(!res.ok){
            throw new Error(`Failed to fetch. ${res.status}`)
        }

        const data = await res.json()
        // console.log(data)

        // convert form string to js Datetime
        state.nowUtc = new Date(data.utc_datetime)

        // update statclock
        statClock.textContent = state.nowUtc.toLocaleTimeString('en-IN',{
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        })

        // update lastSync UI
        syncTime.textContent = new Date().toLocaleTimeString('en-IN', )
        
    } catch (error) {
        console.error('Clock sync failed, falling back to client time', error)

        // fall back to client time
        state.nowUtc = new Date() // -> get local time
        statClock.textContent = state.nowUtc.toLocaleTimeString('en-IN')
        syncTime.textContent = `Fallback to client ${new Date().toLocaleTimeString('en-IN',)}`
    }
}

// slot generator function
function buildSlots(){

    const timeSlots = []

    for( let i = 9; i <= 17; i++ ){
        ['00', '30'].forEach((item)=>{
            // format to always have 2 digits
            let label = `${String(i).padStart(2, "0")}:${item}`

            timeSlots.push({
                label,
                disabled: false
            })
        })
    }

    return timeSlots
}


// function to render time slots
function renderSlots(SelectedProviderId, SelectedDate){
    let timeSlots = buildSlots()
    // console.log(timeSlots)

    // empty slotsGrid element before rendering slots
    slotsGrid.innerHTML = ""

    timeSlots.forEach((slot)=>{
        let slotCard = document.createElement('div')
        slotCard.className = `slotCard h-100 ${slot.disabled ? "disabled": ""} `

        slotCard.innerHTML = `
            <div class='fw-semibold' >${slot.label}</div>
            <div class='small text-secondary' >${slot.disabled ? 'Unavailable': 'Tap to book'}</div>
        `

        slotsGrid.appendChild(slotCard)
    })
}
// renderSlots()

// render slots() when fetch Slots BTN is clicked
fetch_Slots_Btn.addEventListener('click', async()=>{
    
    const SelectedProviderId = providerInput.value
    const SelectedDate = dateInput.value

    if(!SelectedProviderId || !SelectedDate){
        alert('Please select a provider and date')
        return
    }

    console.log('SelectedProviderId', SelectedProviderId)
    console.log('SelectedDate', SelectedDate)

    // sync the clock again
    await fetchNowUtc()
    renderSlots(SelectedProviderId, SelectedDate)

})



// main function -> init()
async function init(){

    readBookings()
    console.log('app Started, bookings: ', state.bookings)

    await fetchProviders()
    renderProviderSelect()
    await fetchNowUtc()


}


// runs automatically when page loads
document.addEventListener("DOMContentLoaded", ()=>{
    init()
})