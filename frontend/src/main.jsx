import React,{useEffect,useState} from "react";
import {createRoot} from "react-dom/client";
import "./styles.css";
import airplaneVideo from "../videos/Airplane.mp4";

const API="http://localhost:8080/api";
const USER_KEY="aeronnexa-user";

function App(){
 const [flights,setFlights]=useState([]);
 const [source,setSource]=useState("Mumbai");
 const [destination,setDestination]=useState("Delhi");
 const [date,setDate]=useState("");
 const [selected,setSelected]=useState(null);
 const [booking,setBooking]=useState({passengerName:"",passengerEmail:"",seatNumber:"12A"});
 const [message,setMessage]=useState("");
 const [fieldErrors,setFieldErrors]=useState({});
 const [loading,setLoading]=useState(false);
 const [authOpen,setAuthOpen]=useState(false);
 const [authMode,setAuthMode]=useState("login");
 const [authForm,setAuthForm]=useState({name:"",email:"",password:""});
 const [currentUser,setCurrentUser]=useState(() => {
   const saved = localStorage.getItem(USER_KEY);
   return saved ? JSON.parse(saved) : null;
 });

 const load=async()=>{
   let url=`${API}/flights`;
   if(source&&destination&&date) url=`${API}/flights/search?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&date=${date}`;
   const r=await fetch(url);
   const data=await r.json();
   if(!r.ok){setMessage(data.message||"Unable to load flights");return;}
   setFlights(data);
 };

 const searchFlights=()=>{
   const errors={};
   if(!source.trim()) errors.source="Source is required";
   if(!destination.trim()) errors.destination="Destination is required";
   if(!date) errors.date="Please select a travel date";
   else if(new Date(`${date}T00:00:00`) < new Date(new Date().toDateString())) errors.date="Please select a valid travel date";
   if(source.trim() && destination.trim() && source.trim().toLowerCase()===destination.trim().toLowerCase()) errors.destination="Source and destination cannot be the same";
   setFieldErrors(errors);
   if(Object.keys(errors).length){setMessage("Please correct the highlighted fields");return;}
   load();
 };

 useEffect(()=>{load()},[]);

 useEffect(()=>{
   if(currentUser) {
     localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
     setBooking(prev=>({
       ...prev,
       passengerName: prev.passengerName || currentUser.name || "",
       passengerEmail: prev.passengerEmail || currentUser.email || ""
     }));
   } else {
     localStorage.removeItem(USER_KEY);
   }
 },[currentUser]);

 const openAuth=(mode)=>{
   setAuthMode(mode);
   setAuthForm({name:"",email:"",password:""});
   setAuthOpen(true);
 };

 const handleAuthSubmit=async(e)=>{
   e.preventDefault();
   const errors={};
   if(authMode==="register" && !authForm.name.trim()) errors.name="Name is required";
   if(authMode==="register" && authForm.name.trim().length===1) errors.name="Name must contain at least 2 characters";
   if(!authForm.email.trim()) errors.email="Email is required";
   else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authForm.email.trim())) errors.email="Please enter a valid email";
   if(!authForm.password) errors.password="Password is required";
   else if(authMode==="register" && authForm.password.length<8) errors.password="Password must be at least 8 characters";
   else if(authMode==="register" && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])/.test(authForm.password)) errors.password="Password must contain uppercase, lowercase, number and special character";
   setFieldErrors(errors);
   if(Object.keys(errors).length){setMessage("Please correct the highlighted fields");return;}
   setLoading(true);
   const endpoint=authMode==="register"?"/auth/register":"/auth/login";
   const payload = authMode === "register"
     ? {name: authForm.name, email: authForm.email, password: authForm.password}
     : {email: authForm.email, password: authForm.password};

  const r=await fetch(`${API}${endpoint}`,{
     method:"POST",
     headers:{"Content-Type":"application/json"},
     body:JSON.stringify(payload)
   });
   const data=await r.json();
  setLoading(false);

   if(!r.ok){
  if(authMode==="register" && r.status===409){
    setFieldErrors({email:"Email is already registered. Please use a different email address."});
  } else {
    setMessage(data.message||"Authentication failed");
  }
  return;
}

   setCurrentUser({id:data.id,name:data.name,email:data.email});
   setAuthOpen(false);
   setMessage(data.message || "Success");
 };

 const handleLogout=async()=>{
   try {
     await fetch(`${API}/auth/logout`,{method:"POST"});
   } catch (error) {
     console.warn("Logout request failed", error);
   }
   setCurrentUser(null);
   setMessage("Logged out successfully");
 };

 const reserve=async()=>{
   if(!selected) return;
   if(!currentUser){
     setMessage("Please log in or register before booking a flight.");
     setAuthOpen(true);
     setAuthMode("login");
     return;
   }

   const errors={};
   if(!booking.passengerName.trim()) errors.passengerName="Passenger name is required";
   if(!booking.passengerEmail.trim()) errors.passengerEmail="Passenger email is required";
   else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.passengerEmail.trim())) errors.passengerEmail="Please enter a valid passenger email";
   if(!booking.seatNumber.trim()) errors.seatNumber="Seat number is required";
   setFieldErrors(errors);
   if(Object.keys(errors).length){setMessage("Please correct the highlighted fields");return;}
   setLoading(true);

   const r=await fetch(`${API}/bookings`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
     flightId:selected.id,
     passengerName: booking.passengerName,
     passengerEmail: booking.passengerEmail,
     seatNumber: booking.seatNumber,
     userId: currentUser.id
   })});
   const data=await r.json();
   setLoading(false);
   if(r.ok){setMessage(`Booking #${data.id} confirmed. Enjoy your journey!`);setSelected(null);load();}
   else setMessage(data.message||"Booking failed");
 };

 return <div className="app">
   <nav className="nav">
     <div className="brand"><span className="logo">✦</span>Aero<span>Nexa</span></div>
     <div className="navlinks">
       <a href="#search">Flights</a>
       <a href="#why">Why AeroNexa</a>
       <button className="outline">My Trips</button>
       {currentUser ? (
         <div className="nav-user">
           <span>Hi, {currentUser.name}</span>
           <button className="logout-btn" onClick={handleLogout}>Logout</button>
         </div>
       ) : (
         <div className="auth-actions">
           <button className="outline" onClick={()=>openAuth("login")}>Login</button>
           <button className="nav-cta" onClick={()=>openAuth("register")}>Register</button>
         </div>
       )}
     </div>
   </nav>

   <header className="hero">
     <div className="hero-copy">
       <p className="eyebrow">THE FUTURE OF FLIGHT BOOKING</p>
       <h1>Travel further.<br/><em>Feel lighter.</em></h1>
       <p className="sub">Discover seamless journeys, transparent fares and a beautifully simple booking experience.</p>
     </div>
     <div className="plane-art">
      <video
      className="airplane-video"
      src={airplaneVideo}
      autoPlay
      loop
      muted
      playsInline
      ref={(video ) => {
        if (video) video.playbackRate = 1.5; // Set the playback speed to 1.5x
        
      }} 
      />
      <div className="plane-overlay">✈</div>

     </div>

   </header>

   <main>
    <section className="search-card" id="search">
      <div className="trip-tabs"><b>Round trip</b><span>One way</span><span>Multi-city</span></div>
      <div className="fields">
      <label>FROM<input value={source} onChange={e=>setSource(e.target.value)} placeholder="City"/>{fieldErrors.source&&<small className="field-error">{fieldErrors.source}</small>}</label>
       <div className="swap">⇄</div>
      <label>TO<input value={destination} onChange={e=>setDestination(e.target.value)} placeholder="City"/>{fieldErrors.destination&&<small className="field-error">{fieldErrors.destination}</small>}</label>
      <label>DATE<input type="date" value={date} onChange={e=>setDate(e.target.value)}/>{fieldErrors.date&&<small className="field-error">{fieldErrors.date}</small>}</label>
      <button className="search" onClick={searchFlights} disabled={loading}> {loading?"Searching...":"Search flights"}</button>
      </div>
    </section>

    {message && <div className="notice">{message}</div>}

    <section className="results">
      <div className="section-head"><div><p className="eyebrow">AVAILABLE JOURNEYS</p><h2>Choose your flight</h2></div><span>{flights.length} results</span></div>
      <div className="flight-grid">
      {flights.map(f=><article className="flight" key={f.id}>
        <div className="airline"><div className="air-icon">✈</div><div><b>{f.airline}</b><small>{f.flightNumber}</small></div></div>
        <div className="route"><div><strong>{f.departureTime?.slice(0,5)}</strong><small>{f.source}</small></div><div className="line">━━━━ ✦ ━━━━</div><div><strong>{f.arrivalTime?.slice(0,5)}</strong><small>{f.destination}</small></div></div>
        <div className="fare"><small>from</small><strong>₹{Number(f.price).toLocaleString("en-IN")}</strong><span>{f.availableSeats} seats</span></div>
        <button className="book" onClick={()=>setSelected(f)}>Book now</button>
      </article>)}
      </div>
    </section>

    <section className="why" id="why">
      <p className="eyebrow">WHY AERONEXA</p><h2>Designed around your journey.</h2>
      <div className="perks"><div><b>01</b><h3>Simple</h3><p>Search and book in a few intuitive steps.</p></div><div><b>02</b><h3>Transparent</h3><p>Clear fares and real-time availability.</p></div><div><b>03</b><h3>Secure</h3><p>Reliable APIs and payment-ready checkout.</p></div></div>
    </section>
   </main>

   {selected && <div className="modal"><div className="modal-card">
     <button className="close" onClick={()=>setSelected(null)}>×</button>
     <p className="eyebrow">COMPLETE YOUR BOOKING</p><h2>{selected.source} → {selected.destination}</h2>
    <div className="form"><input placeholder="Passenger full name" value={booking.passengerName} onChange={e=>setBooking({...booking,passengerName:e.target.value})}/>{fieldErrors.passengerName&&<small className="field-error">{fieldErrors.passengerName}</small>}
    <input placeholder="Email address" value={booking.passengerEmail} onChange={e=>setBooking({...booking,passengerEmail:e.target.value})}/>{fieldErrors.passengerEmail&&<small className="field-error">{fieldErrors.passengerEmail}</small>}
    <input placeholder="Seat number" value={booking.seatNumber} onChange={e=>setBooking({...booking,seatNumber:e.target.value})}/>{fieldErrors.seatNumber&&<small className="field-error">{fieldErrors.seatNumber}</small>}</div>
     <div className="total"><span>Total</span><b>₹{Number(selected.price).toLocaleString("en-IN")}</b></div>
    <button className="pay" onClick={reserve} disabled={loading}>{loading?"Processing...":"Continue to payment"}</button>
     <small className="payment-note">Razorpay test-mode integration endpoint is included in the backend.</small>
   </div></div>}

   {authOpen && <div className="modal auth-modal" onClick={()=>setAuthOpen(false)}><div className="auth-card" onClick={e=>e.stopPropagation()}>
     <button className="close" onClick={()=>setAuthOpen(false)}>×</button>
     <p className="eyebrow">{authMode === "register" ? "CREATE ACCOUNT" : "WELCOME BACK"}</p>
     <h2>{authMode === "register" ? "Register" : "Login"}</h2>
     <form className="auth-form" onSubmit={handleAuthSubmit}>
      {authMode === "register" && <><input type="text" placeholder="Full name" value={authForm.name} onChange={e=>setAuthForm({...authForm,name:e.target.value})}/>{fieldErrors.name&&<small className="field-error">{fieldErrors.name}</small>}</>} 
      <input type="email" placeholder="Email address" value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})}/>{fieldErrors.email&&<small className="field-error">{fieldErrors.email}</small>}
      <input type="password" placeholder="Password" value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})}/>{fieldErrors.password&&<small className="field-error">{fieldErrors.password}</small>}
      <button type="submit" className="pay" disabled={loading}>{loading?"Please wait...":authMode === "register" ? "Create account" : "Login"}</button>
     </form>
     <p className="auth-toggle">
       {authMode === "register" ? "Already have an account?" : "Need an account?"}
       <button type="button" onClick={()=>setAuthMode(authMode === "register" ? "login" : "register")}>
         {authMode === "register" ? "Login" : "Register"}
       </button>
     </p>
   </div></div>}
   <footer>© 2026 AeroNexa · Fly beautifully.</footer>
 </div>
}
createRoot(document.getElementById("root")).render(<App/>);
