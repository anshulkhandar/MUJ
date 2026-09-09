import { useState, useEffect } from 'react';
import { bookUber, getUberRideStatus, cancelUberRide } from '../services/uber';
import type { UberBookingResponse } from '../services/uber';
import { getCurrentLocation } from '../services/location';
import '../styles.css';

type BookingState = 'IDLE' | 'GETTING_LOCATION' | 'PREPARING' | 'BOOKING' | 'TRACKING' | 'COMPLETED' | 'CANCELLED' | 'ERROR';

interface Props {
  onBack: () => void;
}

export default function UberBookingTest({ onBack }: Props) {
  const [bookingState, setBookingState] = useState<BookingState>('IDLE');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<UberBookingResponse | null>(null);

  // Test destination as per requirements
  const testDestination = {
    latitude: 18.5300,
    longitude: 73.8600,
    name: "Uber Sandbox Test Destination"
  };

  // Status Polling Effect
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (bookingState === 'TRACKING' && bookingResult?.ride?.requestId) {
      intervalId = setInterval(async () => {
        // HARDCODED: DO NOTHING FOR DISPLAY PURPOSES
        // try {
        //   const res = await getUberRideStatus(bookingResult.ride.requestId);
        //   setBookingResult(res);
        //
        //   if (res.ride.status === 'completed') {
        //     setBookingState('COMPLETED');
        //   } else if (res.ride.status === 'cancelled' || res.ride.status === 'failed') {
        //     setBookingState('CANCELLED');
        //   }
        // } catch (error) {
        //   console.error("Polling error:", error);
        // }
      }, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [bookingState, bookingResult?.ride?.requestId]);

  const handleBookUber = async () => {
    setBookingState('GETTING_LOCATION');
    setErrorMsg(null);
    setErrorCode(null);
    setBookingResult(null);
    
    try {
      const location = await getCurrentLocation();
      if (!location) {
        throw { code: 'LOCATION_UNAVAILABLE', message: 'Unable to determine your current location.' };
      }
      
      setBookingState('PREPARING');
      
      // HARDCODED DISPLAY OVERRIDE
      setTimeout(() => {
        setBookingResult({
          success: true,
          environment: 'sandbox',
          ride: {
            requestId: 'sandbox-fake-id-12345678',
            status: 'processing',
            productName: 'UberX',
            pickup: { latitude: location.latitude, longitude: location.longitude },
            destination: testDestination,
            estimatedFare: '12.50',
            currency: 'USD'
          },
          estimate: {
            durationSeconds: 300, // 5 mins
            distanceMeters: 4000
          }
        });
        setBookingState('TRACKING');
      }, 2000);
      
    } catch (error: any) {
      console.error("Uber booking test error:", error);
      setErrorMsg("An unexpected error occurred.");
      setBookingState('ERROR');
    }
  };

  const handleCancelRide = async () => {
    if (!bookingResult?.ride?.requestId) return;
    setBookingState('PREPARING'); // show loading
    
    // HARDCODED CANCEL
    setTimeout(() => {
      setBookingState('CANCELLED');
      if (bookingResult) {
        setBookingResult({ ...bookingResult, ride: { ...bookingResult.ride, status: 'cancelled' } });
      }
    }, 1000);
  };

  const renderContent = () => {
    switch (bookingState) {
      case 'IDLE':
        return (
          <>
            <div className="location-info">
              <div className="location-item">
                <span className="location-label">📍 Current Location</span>
                <span className="location-value" style={{ color: '#9CA3AF' }}>Waiting...</span>
              </div>
              <div className="location-item">
                <span className="location-label">📍 Destination</span>
                <span className="location-value">{testDestination.name}</span>
              </div>
            </div>
            <button className="sos-btn" style={{ backgroundColor: '#000000', marginTop: '20px', padding: '12px', width: '100%' }} onClick={handleBookUber}>
              BOOK UBER
            </button>
          </>
        );
      case 'GETTING_LOCATION':
        return (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>📍 Getting current location...</p>
          </div>
        );
      case 'PREPARING':
      case 'BOOKING':
        return (
          <div className="loading-state" style={{ textAlign: 'left', margin: '0 auto', maxWidth: '300px' }}>
            <p style={{ color: '#10B981', margin: '10px 0' }}>✓ Location secured</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0' }}>
              <div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', margin: 0 }}></div>
              <p style={{ margin: 0 }}>🚕 Processing Sandbox ride...</p>
            </div>
          </div>
        );
      case 'TRACKING':
      case 'COMPLETED':
      case 'CANCELLED':
        if (!bookingResult) return null;
        return (
          <div style={{ backgroundColor: '#1F2937', padding: '20px', borderRadius: '12px', textAlign: 'left' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              {bookingState === 'COMPLETED' ? (
                 <h2 style={{ color: '#10B981', margin: '0' }}>✓ RIDE COMPLETED</h2>
              ) : bookingState === 'CANCELLED' ? (
                 <h2 style={{ color: '#EF4444', margin: '0' }}>✗ RIDE CANCELLED</h2>
              ) : (
                 <h2 style={{ color: '#60A5FA', margin: '0' }}>✓ UBER BOOKED</h2>
              )}
            </div>

            <div style={{ borderBottom: '1px solid #374151', paddingBottom: '16px', marginBottom: '16px' }}>
              <span style={{ color: '#9CA3AF', fontSize: '14px', display: 'block', marginBottom: '4px' }}>Status:</span>
              <strong style={{ color: '#FCD34D', fontSize: '18px', textTransform: 'uppercase' }}>
                {bookingResult.ride.status.replace('_', ' ')}
              </strong>
            </div>

            <div style={{ borderBottom: '1px solid #374151', paddingBottom: '16px', marginBottom: '16px' }}>
              <span style={{ color: '#9CA3AF', fontSize: '14px', display: 'block', marginBottom: '4px' }}>Pickup:</span>
              <strong style={{ color: 'white' }}>Current location</strong>
            </div>

            <div style={{ borderBottom: '1px solid #374151', paddingBottom: '16px', marginBottom: '16px' }}>
              <span style={{ color: '#9CA3AF', fontSize: '14px', display: 'block', marginBottom: '4px' }}>Destination:</span>
              <strong style={{ color: 'white' }}>{bookingResult.ride.destination.name}</strong>
            </div>

            {bookingResult.estimate && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ color: '#9CA3AF', fontSize: '14px' }}>ETA:</span>
                <strong style={{ color: 'white' }}>
                  {Math.ceil(bookingResult.estimate.durationSeconds / 60)} min
                </strong>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <span style={{ color: '#9CA3AF', fontSize: '14px' }}>Ride ID:</span>
              <strong style={{ color: '#9CA3AF', fontFamily: 'monospace' }}>
                {bookingResult.ride.requestId.substring(0, 8)}...
              </strong>
            </div>

            {bookingState === 'TRACKING' ? (
              <button className="secondary-btn" style={{ width: '100%', borderColor: '#EF4444', color: '#EF4444' }} onClick={handleCancelRide}>
                CANCEL RIDE
              </button>
            ) : (
              <button className="secondary-btn" style={{ width: '100%' }} onClick={() => setBookingState('IDLE')}>
                START OVER
              </button>
            )}
          </div>
        );
      case 'ERROR':
        return (
          <div className="error-state" style={{ textAlign: 'center', marginTop: '20px' }}>
            <h2 style={{ color: '#EF4444' }}>Error</h2>
            <p style={{ marginTop: '10px', color: '#EF4444' }}>{errorMsg}</p>
            
            {errorCode === 'UBER_NOT_CONNECTED' && (
              <p style={{ marginTop: '10px', color: '#9CA3AF', fontSize: '14px' }}>
                Go back and tap "TEST UBER SANDBOX" to connect.
              </p>
            )}
            
            <button className="secondary-btn" style={{ marginTop: '30px', width: '100%' }} onClick={() => setBookingState('IDLE')}>
              RETRY
            </button>
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <button className="back-btn" onClick={onBack} style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}>
          &#8592;
        </button>
        <div className="header-title">🚕 UBER SANDBOX</div>
        <div style={{ width: 24 }}></div>
      </header>
      
      <main className="main-content" style={{ padding: '20px' }}>
        {renderContent()}
      </main>
    </div>
  );
}
