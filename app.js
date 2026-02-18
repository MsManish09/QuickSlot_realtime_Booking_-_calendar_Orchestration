
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

// UI state to render bookings based on filter
let selectedBookingFilter = 'all'


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
const slotsHeadline = document.getElementById('slotsHeadline')
const bookingsGrid = document.getElementById('bookingsGrid')
const clearAllBookings_Btn = document.getElementById('clearAllBookings_Btn')

const bookingFilter = document.getElementById('bookingFilter')
const refreshSearchOrch_btn = document.getElementById('refreshSearchOrch_btn')

// modal elements
const modal = new bootstrap.Modal(
    document.getElementById('confirmBookingModal')
)
const confirmBookingBtn = document.getElementById('confirmBookingBtn')
const toastElement = document.getElementById("appToast")
const toastMessage = document.getElementById("toastMessage")
const toast = new bootstrap.Toast(toastElement)

// toast functionality
function showToast(message, type='primary'){

    // remove previous color classes
    toastElement.classList.remove(
        "text-bg-primary",
        "text-bg-success",
        "text-bg-danger",
        "text-bg-warning"
    )

    // add new color class
    toastElement.classList.add(`text-bg-${type}`)

    toastMessage.textContent = message
    toast.show()
}

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

    providerInput.innerHTML =`<option>Select Provider</option>`

    bookingFilter.innerHTML = `<option value='all' >All Provider</option>`

    state.providers.forEach(p => {

        // console.log(p)
        
        const opt = document.createElement('option')
        opt.value = p.id
        opt.textContent = `${p.name} - ${p.specialty}`

        providerInput.appendChild(opt)

        // also populate bookings filter iwth provider
        const fitlerOpt = document.createElement('option')
        fitlerOpt.value = p.id
        fitlerOpt.textContent = `${p.name}`

        bookingFilter.appendChild(fitlerOpt)

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
                disabled: isSlotDisabled(state.target.date, label)
            })
        })
    }

    return timeSlots
}


// function to render time slots
function renderSlots(){
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

        // making slotCard bookable
        
        slotCard.addEventListener('click', ()=>{

            // only if slot is not disabled
            if(!slot.disabled){
                console.log(state.target)

                state.pendingSlot = {
                    providerId: state.target.providerId,
                    providerName: state.target.providerName,
                    date: state.target.date,
                    slot: slot.label
                }

                // open modal
                modal.show()
                
                const confirmText = document.getElementById("confirmBookingText")
                confirmText.textContent = `Schedule the booking for ${slot.label} on ${state.target.date}?`
                
            }
            
        })
    })
}

// modal booking confirmation functionaliy
confirmBookingBtn.addEventListener('click', ()=>{
    // if there is no pending slot
    if(!state.pendingSlot) return

    //else -> update bookings state and save, persist -> re-render
    state.bookings.push(state.pendingSlot)
    saveBookings()
    renderSlots()
    renderBookings()

    //update statBookings UI
    statBookings.innerText = state.bookings.length

    // empty the pending slot state
    state.pendingSlot = null

    // hide modal
    modal.hide()

    showToast('Booking confirmed', 'success')

})

// function to disable slots -> past time and aleready booked slots
function isSlotDisabled(date, slotLabel){

    const slotDateTime = new Date(`${date}T${slotLabel}:00`)
    // 1 - if the slot time is past current time
    if( slotDateTime < state.nowUtc ){
        return true
    }

    // 2 - if slot already booked
    const isBooked = state.bookings.some((booking)=>
        booking.providerId === state.target.providerId &&
        booking.date === date &&
        booking.slot === slotLabel
    )

    // if already booked -> return disable true
    if(isBooked){
        return true
    }

    // else return false
    return false
}

// render slots() when fetch Slots BTN is clicked
fetch_Slots_Btn.addEventListener('click', async()=>{
    
    const selectedProviderId = providerInput.value
    const selectedDate = dateInput.value

    if(!selectedProviderId || !selectedDate){
        alert('Please select a provider and date')
        return
    }

    // sync the clock again
    await fetchNowUtc()

    // update target state
    state.target = {
        providerId: selectedProviderId,
        date: selectedDate 
    }
    renderSlots()

    // update slots heading
    slotsHeadline.innerText = ''

    // extract provider name using provider id
    let provider = state.providers.find(p=> p.id == selectedProviderId)

    slotsHeadline.innerText = `${provider.name} - ${new Date(selectedDate).toLocaleDateString('en-IN')}`
 
    // console.log(state.target)

})

// update my bookings UI (bookingsGrid) -> on Dom LOad and booking updates

function renderBookings(){

    let bookingsToRender = []

    bookingsGrid.innerHTML = ''

    // if bookings list in 0
    if(state.bookings.length === 0){
        bookingsGrid.innerHTML = '<div>No Bookings Yet!</div>'
        return
    }

    // if booking filter value is all
    if(selectedBookingFilter == 'all'){
        bookingsToRender = state.bookings
    }

    // when filter value changes
    else{
        bookingsToRender = state.bookings.filter(p => p.providerId == selectedBookingFilter )
    }

    
    bookingsToRender.forEach((booking, index)=>{

        let bookingCard = document.createElement('div')
        bookingCard.className = 'bookingCard shadow-lg '

        // extract provider name using provider id
        let provider = state.providers.find(p=> p.id == booking.providerId)

        console.log(provider)

        bookingCard.innerHTML = `
            <div>${provider.name}</div>
            <div>${booking.date}</div>
            <div>${booking.slot}</div>
            <button class='deleteBookingBtn'>Delete</button>
        `
        // adding individual booking delete functionality
        const deleteBookingBtn = bookingCard.querySelector('.deleteBookingBtn')

        deleteBookingBtn.addEventListener('click',()=>{
                // if all the id, date, slot matches , return false, filter out of the state.booking -> deletes the booking
                state.bookings = state.bookings.filter(b=> 
                    !(
                        b.providerId === booking.providerId &&
                        b.date === booking.date &&
                        b.slot === booking.slot
                    )
                )
                saveBookings()
                renderBookings()

                // generate slots if target state is prsent
                if(state.target) renderSlots()

                statBookings.innerText = state.bookings.length

                // show delete toast
                showToast('Booking deleted', 'danger')
            }
        )

        bookingsGrid.appendChild(bookingCard)
    })

}

// clear all bookings functionality
clearAllBookings_Btn.addEventListener('click', ()=>{

    // clear state.bookings and save in localStorage
    state.bookings = []
    saveBookings()
    // re-render bookings
    renderBookings()
    statBookings.innerText = 0

    // show cleared all toast
    showToast('All bookings cleared', 'warning')

    if(state.target) renderSlots()
} )

// filter bookings by provider functionality
bookingFilter.addEventListener('change', ()=>{
    selectedBookingFilter = bookingFilter.value
    renderBookings()
})


// refresh btn functionality
refreshSearchOrch_btn.addEventListener('click', async ()=>{

    // toast a warning if provider and date is not selected
    if(!state.target){
        showToast('Select provide and date first', 'warning')
        return
    }

    // else
    await fetchNowUtc() // update clock
    renderSlots() // re-render slots

    showToast('Availability refreshed', 'primary')
})



// main function -> init()
async function init(){

    readBookings()
    console.log('app Started, bookings: ', state.bookings)

    await fetchProviders()
    renderProviderSelect()
    renderBookings()
    await fetchNowUtc()

}


// runs automatically when page loads
document.addEventListener("DOMContentLoaded", ()=>{
    init()
})