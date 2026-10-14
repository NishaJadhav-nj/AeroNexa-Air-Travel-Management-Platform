import React,{useEffect,useRef,useState} from "react";
import {createRoot} from "react-dom/client";
import "./styles.css";
import airplaneVideo from "../videos/Airplane.mp4";

const API="http://localhost:8080/api";
const USER_KEY="aeronnexa-user";

function App(){
 const destinationCarouselRef=useRef(null);
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
 const [authPrompt,setAuthPrompt]=useState("");
 const [authError,setAuthError]=useState("");
 const [authForm,setAuthForm]=useState({name:"",email:"",password:""});
 const [myTripsOpen,setMyTripsOpen]=useState(false);
 const [myTrips,setMyTrips]=useState([]);
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

 const scrollDestinations=(direction)=>{
   const carousel=destinationCarouselRef.current;
   if(!carousel)return;
   const loopWidth=carousel.querySelector(".destination-set")?.getBoundingClientRect().width || 0;
   if(direction<0&&carousel.scrollLeft<1) carousel.scrollLeft=loopWidth;
   carousel.scrollLeft+=direction*Math.min(carousel.clientWidth*0.8,500);
 };

 useEffect(()=>{load()},[]);

 useEffect(()=>{
   const carousel=destinationCarouselRef.current;
   if(!carousel||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;

   let animationFrame;
   let previousTime;
   const animate=(time)=>{
     if(previousTime!==undefined){
       carousel.scrollLeft+=Math.min(time-previousTime,32)*0.03;
       const loopWidth=carousel.querySelector(".destination-set")?.getBoundingClientRect().width || 0;
       if(loopWidth>0&&carousel.scrollLeft>=loopWidth)carousel.scrollLeft-=loopWidth;
     }
     previousTime=time;
     animationFrame=requestAnimationFrame(animate);
   };

   animationFrame=requestAnimationFrame(animate);

   return ()=>{
     cancelAnimationFrame(animationFrame);
   };
 },[]);

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

 const openAuth=(mode,prompt="")=>{
   setMessage("");
   setAuthError("");
   setFieldErrors({});
   setAuthMode(mode);
   setAuthPrompt(prompt);
   setAuthForm({name:"",email:"",password:""});
   setAuthOpen(true);
 };

 const handleAuthSubmit=async(e)=>{
   e.preventDefault();
   setAuthError("");
   const errors={};
   if(authMode==="register" && !authForm.name.trim()) errors.name="Name is required";
   if(authMode==="register" && authForm.name.trim().length===1) errors.name="Name must contain at least 2 characters";
   if(!authForm.email.trim()) errors.email="Email is required";
   else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authForm.email.trim())) errors.email="Please enter a valid email";
   if(!authForm.password) errors.password="Password is required";
   else if(authMode==="register" && authForm.password.length<8) errors.password="Password must be at least 8 characters";
   else if(authMode==="register" && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])/.test(authForm.password)) errors.password="Password must contain uppercase, lowercase, number and special character";
   setFieldErrors(errors);
   if(Object.keys(errors).length)return;
   setLoading(true);
   const endpoint=authMode==="register"?"/auth/register":"/auth/login";
   const payload = authMode === "register"
     ? {name: authForm.name, email: authForm.email, password: authForm.password}
     : {email: authForm.email, password: authForm.password};

   try {
     const r=await fetch(`${API}${endpoint}`,{
       method:"POST",
       headers:{"Content-Type":"application/json"},
       body:JSON.stringify(payload)
     });
     const data=await r.json();

     if(!r.ok){
       if(authMode==="register" && r.status===409){
         setFieldErrors({email:"Email is already registered. Please use a different email address."});
       } else {
         setAuthError(data.message || (authMode==="login"
           ? "Invalid email or password. Please check your details and try again."
           : "Unable to create your account. Please check your details and try again."));
       }
       return;
     }

     setCurrentUser({id:data.id,name:data.name,email:data.email});
     setAuthOpen(false);
     setAuthPrompt("");
     setAuthError("");
     setMessage(data.message || "Success");
   } catch (error) {
     console.error("Authentication request failed", error);
     setAuthError("Unable to connect right now. Please try again.");
   } finally {
     setLoading(false);
   }
 };

 const handleLogout=async()=>{
   try {
     await fetch(`${API}/auth/logout`,{method:"POST"});
   } catch (error) {
     console.warn("Logout request failed", error);
   }
   setCurrentUser(null);
   setMyTripsOpen(false);
   setMessage("Logged out successfully");
 };

 const openMyTrips=async()=>{
   if(!currentUser){
     openAuth("login","Sign in to view your booked trips.");
     return;
   }

   try {
     setLoading(true);
     const r=await fetch(`${API}/bookings/user/${currentUser.id}`);
     const data=await r.json();
     setLoading(false);

     if(!r.ok){
       setMessage(data.message || "Unable to load your trips");
       return;
     }

     setMyTrips(data || []);
     setMyTripsOpen(true);
   } catch (error) {
     setLoading(false);
     setMessage("Unable to load your trips right now.");
   }
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
       <a href="#why">About us</a>
       <a href="#travel-info">Travel Info</a>
       <button className="outline" onClick={openMyTrips}>My Trips</button>
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

    <section className="popular-destinations" aria-label="Popular destinations">
      <div className="destination-heading">
        <div>
          <p className="eyebrow">A LITTLE INSPIRATION</p>
          <h2>Popular Destinations</h2>
        </div>
        <span className="destination-note">A few places worth dreaming about</span>
      </div>
      <div className="destination-carousel-wrap">
        <button className="destination-arrow destination-arrow--left" type="button" aria-label="Scroll destinations left" onClick={()=>scrollDestinations(-1)}>←</button>
        <div className="destination-carousel" ref={destinationCarouselRef}>
        <div className="destination-track">
          <div className="destination-set">
            <article className="destination-card">
              <img src="/images/destinations/dubai.png" alt="Dubai skyline at dusk" />
              <div className="destination-caption"><span>United Arab Emirates</span><h3>Dubai</h3></div>
            </article>
            <article className="destination-card">
              <img src="/images/destinations/new-york.png" alt="New York City skyline by the river" />
              <div className="destination-caption"><span>United States</span><h3>New York</h3></div>
            </article>
            <article className="destination-card">
              <img src="/images/destinations/paris.png" alt="The Eiffel Tower in Paris" />
              <div className="destination-caption"><span>France</span><h3>Paris</h3></div>
            </article>
            <article className="destination-card">
              <img src="/images/destinations/mumbai.png" alt="Mumbai skyline at twilight" />
              <div className="destination-caption"><span>India</span><h3>Mumbai</h3></div>
            </article>
          </div>
          <div className="destination-set" aria-hidden="true">
            <article className="destination-card">
              <img src="/images/destinations/dubai.png" alt="" />
              <div className="destination-caption"><span>United Arab Emirates</span><h3>Dubai</h3></div>
            </article>
            <article className="destination-card">
              <img src="/images/destinations/new-york.png" alt="" />
              <div className="destination-caption"><span>United States</span><h3>New York</h3></div>
            </article>
            <article className="destination-card">
              <img src="/images/destinations/paris.png" alt="" />
              <div className="destination-caption"><span>France</span><h3>Paris</h3></div>
            </article>
            <article className="destination-card">
              <img src="/images/destinations/mumbai.png" alt="" />
              <div className="destination-caption"><span>India</span><h3>Mumbai</h3></div>
            </article>
          </div>
        </div>
        </div>
        <button className="destination-arrow destination-arrow--right" type="button" aria-label="Scroll destinations right" onClick={()=>scrollDestinations(1)}>→</button>
      </div>
    </section>

    <section className="why about-section" id="why">
      <div className="about-heading">
        <p className="eyebrow">ABOUT AERONEXA</p>
        <h2>Your Journey, Our Priority.</h2>
        <p className="about-welcome">Welcome to <strong>AeroNexa — Your Gateway to Seamless Air Travel.</strong></p>
        <p>AeroNexa is a modern flight booking and management platform designed to make air travel simple, convenient, and accessible. Our goal is to provide travelers with a smooth booking experience, from searching for flights to managing their trips, all in one place.</p>
        <p>With an intuitive interface and user-friendly features, AeroNexa allows users to explore available flights, compare travel options, book tickets, manage reservations, and access their booking history with ease.</p>
      </div>

      <div className="about-pillars">
        <article className="about-pillar about-mission">
          <span className="about-icon" aria-hidden="true">✈</span>
          <div><h3>Our Mission</h3><p>To simplify air travel through technology by making flight search, booking, and reservation management more convenient and user-friendly.</p></div>
        </article>
        <article className="about-pillar about-vision">
          <span className="about-icon" aria-hidden="true">◎</span>
          <div><h3>Our Vision</h3><p>To create a smarter and more accessible travel experience where every journey begins with confidence and convenience.</p></div>
        </article>
      </div>

      <div className="about-offers">
        <div className="about-subheading">
          <p className="eyebrow">TRAVEL MADE SIMPLE</p>
          <h3>What We Offer</h3>
        </div>
        <div className="about-offer-grid">
          <article className="about-offer-card"><span aria-hidden="true">⌕</span><h4>Easy Flight Search</h4><p>Find flights based on your departure city, destination, and travel date.</p></article>
          <article className="about-offer-card"><span aria-hidden="true">▣</span><h4>Simple Booking Experience</h4><p>Book flights through a streamlined reservation process.</p></article>
          <article className="about-offer-card"><span aria-hidden="true">▤</span><h4>Booking Management</h4><p>View your trips, track reservations, and manage cancellations.</p></article>
          <article className="about-offer-card"><span aria-hidden="true">◇</span><h4>Secure User Access</h4><p>Sign up and log in to access personalized booking features.</p></article>
          <article className="about-offer-card"><span aria-hidden="true">₹</span><h4>Convenient Payments</h4><p>Experience an integrated payment flow for flight bookings.</p></article>
          <article className="about-offer-card"><span aria-hidden="true">⚙</span><h4>Admin Flight Management</h4><p>Manage flight information and keep flight listings organized.</p></article>
        </div>
      </div>

      <div className="about-why">
        <span className="about-why-icon" aria-hidden="true">✦</span>
        <div>
          <h3>Why Choose AeroNexa?</h3>
          <p>We believe planning a journey should be as enjoyable as the journey itself. AeroNexa focuses on simplicity, convenience, and an organized booking experience to help travelers manage their plans with confidence.</p>
        </div>
      </div>

      <p className="about-tagline">AeroNexa — <strong>Explore More. Travel Smarter. Fly Beyond.</strong></p>
    </section>

    <section className="travel-info" id="travel-info">
      <div className="travel-info-heading">
        <p className="eyebrow">PLAN WITH CONFIDENCE</p>
        <h2>Travel Information</h2>
        <p>Helpful reminders for a smoother journey. Airline rules can vary, so always confirm details on your ticket or with your airline.</p>
      </div>
      <div className="travel-info-grid">
        <article className="travel-info-card">
          <span className="travel-info-number">01</span>
          <h3>Baggage</h3>
          <p>Check your airline’s cabin and checked baggage allowances, size limits, and restricted-item rules before packing.</p>
        </article>
        <article className="travel-info-card">
          <span className="travel-info-number">02</span>
          <h3>Check-in</h3>
          <p>Check your airline’s online check-in opening and closing times. Keep your booking reference and identification ready.</p>
        </article>
        <article className="travel-info-card">
          <span className="travel-info-number">03</span>
          <h3>Cancellation</h3>
          <p>Cancellation options and fees depend on your fare and airline. Review the fare conditions before requesting a cancellation.</p>
        </article>
        <article className="travel-info-card">
          <span className="travel-info-number">04</span>
          <h3>Refund policy</h3>
          <p>Refund eligibility and processing times vary by ticket and payment method. Check your booking terms for the applicable rules.</p>
        </article>
        <article className="travel-info-card">
          <span className="travel-info-number">05</span>
          <h3>Travel documents</h3>
          <p>Bring valid identification and any documents required for your route. International journeys may require additional documents.</p>
        </article>
        <article className="travel-info-card">
          <span className="travel-info-number">06</span>
          <h3>Airport information</h3>
          <p>Confirm your departure terminal and check your flight status before leaving. Allow enough time for airport procedures.</p>
        </article>
      </div>
      <div className="travel-faq">
        <div className="travel-faq-heading">
          <p className="eyebrow">QUICK ANSWERS</p>
          <h3>Frequently asked questions</h3>
        </div>
        <details>
          <summary>Where can I find my booking details?</summary>
          <p>Log in and open My Trips to see the bookings associated with your account.</p>
        </details>
        <details>
          <summary>How much baggage can I bring?</summary>
          <p>Baggage allowance depends on the airline, route, and fare. Check the allowance shown by your airline for your specific flight.</p>
        </details>
        <details>
          <summary>How do I cancel a booking or request a refund?</summary>
          <p>Review your ticket’s cancellation and refund conditions, then contact the airline or booking support channel shown in your confirmation.</p>
        </details>
        <details>
          <summary>Which documents should I bring to the airport?</summary>
          <p>Bring the valid identification and travel documents required for your journey, and make sure the passenger details match your booking.</p>
        </details>
      </div>
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
     <p className="eyebrow">{authMode === "register" ? "CREATE ACCOUNT" : authMode === "forgot" ? "ACCOUNT RECOVERY" : "WELCOME BACK"}</p>
     <h2>{authMode === "register" ? "Register" : authMode === "forgot" ? "Forgot password?" : "Login"}</h2>
     {authPrompt && <p className="auth-context">{authPrompt}</p>}
     {authError && <p className="auth-error" role="alert" aria-live="assertive">{authError}</p>}
     {authMode === "forgot" ? (
       <>
         <p className="auth-recovery-note" role="status">
           Password reset is not available yet because email delivery has not been configured. Please contact the administrator for help.
         </p>
         <button type="button" className="pay" onClick={()=>{
           setAuthMode("login");
           setAuthError("");
           setFieldErrors({});
         }}>Back to login</button>
       </>
     ) : (
       <>
         <form className="auth-form" onSubmit={handleAuthSubmit}>
          {authMode === "register" && <><input type="text" placeholder="Full name" value={authForm.name} onChange={e=>setAuthForm({...authForm,name:e.target.value})}/>{fieldErrors.name&&<small className="field-error">{fieldErrors.name}</small>}</>}
          <input type="email" placeholder="Email address" value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})}/>{fieldErrors.email&&<small className="field-error">{fieldErrors.email}</small>}
          <input type="password" placeholder="Password" value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})}/>{fieldErrors.password&&<small className="field-error">{fieldErrors.password}</small>}
          <button type="submit" className="pay" disabled={loading}>{loading?"Please wait...":authMode === "register" ? "Create account" : "Login"}</button>
         </form>
         {authMode === "login" && <button type="button" className="forgot-password-link" onClick={()=>{
           setAuthMode("forgot");
           setAuthError("");
           setFieldErrors({});
         }}>Forgot password?</button>}
         <p className="auth-toggle">
           {authMode === "register" ? "Already have an account?" : "Need an account?"}
           <button type="button" onClick={()=>{
             setAuthMode(authMode === "register" ? "login" : "register");
             setAuthError("");
             setFieldErrors({});
           }}>
             {authMode === "register" ? "Login" : "Register"}
           </button>
         </p>
       </>
     )}
   </div></div>}

   {myTripsOpen && <div className="modal" onClick={()=>setMyTripsOpen(false)}><div className="modal-card trips-card" onClick={e=>e.stopPropagation()}>
     <button className="close" onClick={()=>setMyTripsOpen(false)}>×</button>
     <p className="eyebrow">YOUR TRIPS</p>
     <h2>Upcoming journeys</h2>
     {myTrips.length === 0 ? (
       <div className="empty-trips">
         <p>No trips booked yet.</p>
         <button className="pay" onClick={()=>{setMyTripsOpen(false); document.getElementById("search")?.scrollIntoView({behavior:"smooth"});}}>Book a flight</button>
       </div>
     ) : (
       <div className="trip-list">
         {myTrips.map(trip => (
           <div className="trip-item" key={trip.id}>
             <div>
               <span className="trip-status">{trip.status}</span>
               <h3>{trip.flight?.source} → {trip.flight?.destination}</h3>
             </div>
             <p>{trip.flight?.airline} · {trip.flight?.flightNumber}</p>
             <p>{trip.flight?.departureTime?.slice(0,5)} → {trip.flight?.arrivalTime?.slice(0,5)}</p>
             <p>Seat {trip.seatNumber} · {new Date(trip.bookedAt).toLocaleDateString("en-IN", {day:"2-digit", month:"short", year:"numeric"})}</p>
           </div>
         ))}
       </div>
     )}
   </div></div>}
   <footer>© 2026 AeroNexa · Fly beautifully.</footer>
 </div>
}
createRoot(document.getElementById("root")).render(<App/>);
