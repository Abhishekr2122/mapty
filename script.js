'use strict';

class workout{
    date = new Date();
    id = (Date.now() + " ").slice(-10)
    clicks =0;

    constructor(coords,distance,duration){
        this.coords = coords; // [latitude,longitude]
        this.distance = distance;  // in km
        this.duration = duration;  // in min
    }


    _setDescription(){
// prettier-ignore
   const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
   this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
    }

    click(){
      this.clicks++;
    }

}

// Running workout Architecture
class Running extends workout{
  type = "running";  
  constructor(coords,distance,duration,cadence){
    super(coords,distance,duration);
    this.cadence = cadence;
    this.calcpace();
    this._setDescription();
  }

  calcpace(){
    // min/km
    this.pace = this.duration/this.distance;
    return this.pace;
  }
}


// Cycling workout Architecture
class Cycling extends workout{
    type = "cycling";
   constructor(coords,distance,duration,elevationgain){
    super(coords,distance,duration);
    this.elevationgain = elevationgain;
    this.calcSpeed();
    this._setDescription();
   }

   calcSpeed(){
    // km/hr
    this.speed = this.distance/(this.duration/60);
    return this.calcSpeed;
   }
}


const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
// App Architecture
class App{
    #map;
    #mapEvent;
    #workouts = [];
    #mapZoomLevel = 13;
    constructor(){
     this._getPosition();
     this._getLocalStorage();
     form.addEventListener("submit",this._newWorkout.bind(this));
     inputType.addEventListener("change",this._toggleElevationField);
     containerWorkouts.addEventListener("click",this._moveToPopup.bind(this));
    }

    _getPosition(){if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(this._loadmap.bind(this),function(){
            alert("coordinates not found");
        })
    }}

    _loadmap(position){console.log(position);
        // destructuring objects
        const {latitude} = position.coords;
        const {longitude} = position.coords;
        // or else we can do in this way
        // const latitude = position.coords.latitude;
        // const longitude = possition.coords.longitude;
        console.log(`https://www.google.com/maps/@${latitude},${longitude},15z`);
        const coords = [latitude,longitude];
         this.#map = L.map("map").setView(coords, 13);
        // Note here the map("id name of the html element in which the map will be displayed")
    
    
        // Adding the map to the project ussing leaflet its an opensource javascript library used to build web mapping applications.
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map);
    
    // Handling clicks on map.
     this.#map.on("click",this._showForm.bind(this));

     this.#workouts.forEach(work=>{this._renderWorkoutMarker(work)});
    }

    _showForm(mapE){this.#mapEvent=mapE;
        form.classList.remove("hidden");
        inputDistance.focus();
   }

   _hideForm(){
    // clearing the input fields
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = "";
     
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(()=>(form.style.display = "grid"),1000)
    
   }

    _toggleElevationField(){
        inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
     inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    
    }

    _newWorkout(e){

        const validInputs = function(...inputs){
            const result = inputs.every(function(elem){
             return Number.isFinite(elem);
            })

            return result;
        };

        const positiveInputs = function(...inputs){
           const result =  inputs.every(function(elem){
                return elem>0;
            })

            return result;
        };

       
        e.preventDefault();
        console.log(e);
       

    //  get the data from the form

    const type = inputType.value;
    const distance  = +inputDistance.value; // As the form data comes into data type string and distance iss numeric value so conversion of string
    // to number.
    const duration = +inputDuration.value;
    const {lat,lng} =this.#mapEvent.latlng;
    let workout;

   


    
    // If workout running, create running object
    if(type === "running"){
        const cadence = +inputCadence.value;
        // check if the data is valid
        if(
            
            !validInputs(distance,duration,cadence) || !positiveInputs(distance,duration,cadence)
            // !Number.isFinite(distance)||!Number.isFinite(duration)||!Number.isFinite(cadence)
            ){
                return alert("The Number must be positive");
        }

        workout = new Running([lat,lng],distance,duration,cadence);
        
    }

    // // If workout is cycling, create cycling object
    if(type === "cycling"){
        const elevation = +inputElevation.value;
         // check if the data is valid
         if( 
            !validInputs(distance,duration,elevation) || !positiveInputs(distance,duration)
            // !Number.isFinite(distance)||!Number.isFinite(duration)||!Number.isFinite(elevation)
            ){
            return alert("The input must be positive");
         }
         workout= new Cycling([lat,lng],distance,duration,elevation);

    }
    
    // Add new object to the workout Array
    this.#workouts.push(workout);
    
    // Render workout on map as marker
      this._renderWorkoutMarker(workout);  
    
    // Render workout on the list

    this._renderWorkout(workout);

    // hiding form +  clearing input fields

    this._hideForm();

    // set local storage to all workouts
    this._setLocalStorage();
    
    }

    _renderWorkoutMarker(workout){
        L.marker(workout.coords).addTo(this.#map)
        .bindPopup(L.popup({
            maxwidth:300,
            minwidth:100,
            autoClose:false,
            closeOnClick:false,
            className: `${workout.type}-popup`
        })).setPopupContent(`${workout.type==="running"?'🏃':'🚴‍♀️'} ${workout.description}`)
        .openPopup();
   }

   _renderWorkout(workout){
    let html =
     `<li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type==="running"?'🏃':'🚴‍♀️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

      if(workout.type=== "running"){
         html+= 
         ` <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
         `;
      }  
      
      if(workout.type==="cycling"){
        html+=
        ` <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationgain}</span>
        <span class="workout__unit">m</span>
      </div>
     </li> 
        `;
      }
  

      console.log(html);
      form.insertAdjacentHTML("afterend",html);
   }


   _moveToPopup(e){
    const workoutEl = e.target.closest(".workout");

    if(!workoutEl){
      return ;
    }
   
    const workout = this.#workouts.find(work=>work.id===workoutEl.dataset.id);
   
    this.#map.setView(workout.coords,this.#mapZoomLevel,{animate:true,pan:{duration:1,}})

    // using the public interface
    // workout.click();

   }

   _setLocalStorage(){
    localStorage.setItem("workouts",JSON.stringify(this.#workouts));
   }
   _getLocalStorage(){
    const data = JSON.parse(localStorage.getItem("workouts"));
    if(!data){
      return;
    }
    
    // restoring the workout data
    this.#workouts = data;

    this.#workouts.forEach(work=>{this._renderWorkout(work)});
   }
   
}

const app = new App();

