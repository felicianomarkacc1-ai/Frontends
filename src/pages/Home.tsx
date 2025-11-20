// src/pages/Home.tsx
import { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonModal,
  IonItem,
  IonLabel,
  IonInput,
  IonButtons,
  useIonRouter
} from '@ionic/react';
import { logIn, informationCircle } from 'ionicons/icons';
import { loginUser } from '../services/auth.service';
import './Home.css';

const Home: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [error, setError] = useState('');
  const router = useIonRouter();

  const handleLogin = async () => {
    try {
      setError('');
      const result = await loginUser(email, password);
      if (result.user.role === 'admin') {
        router.push('/admin', 'root', 'replace');
      } else {
        router.push('/member', 'root', 'replace');
      }
      setShowLogin(false);
    } catch (error: any) {
      setError(error.message);
      console.error('Login error:', error);
    }
  };

  return (
    <IonPage className="home-page">
      <IonHeader>
        <IonToolbar>
          <IonTitle>🏋️ ActiveCore</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="hero-section">
          <h1>Welcome to ActiveCore</h1>
          <p>
            <strong>ActiveCore</strong> is your all-in-one fitness companion. Track your progress, manage your gym attendance, access personalized meal plans, and unlock rewards as you achieve your goals. Join our community and transform your fitness journey today!
          </p>
          <div className="cta-buttons">
            <IonButton 
              className="secondary-button"
              fill="outline" 
              size="large"
              onClick={() => setShowLearnMore(true)}
            >
              <IonIcon icon={informationCircle} slot="start" />
              Learn More
            </IonButton>
            <IonButton 
              className="login-button"
              fill="clear"
              onClick={() => setShowLogin(true)}
            >
              <IonIcon icon={logIn} slot="start" />
              Log In
            </IonButton>
          </div>
        </div>

        <div className="stats-section">
          <div className="stat-card">
            <h2>5,000+</h2>
            <p>Active Members</p>
            <span>Growing daily</span>
          </div>
          <div className="stat-card">
            <h2>500+</h2>
            <p>Classes Weekly</p>
            <span>Various disciplines</span>
          </div>
          <div className="stat-card">
            <h2>50+</h2>
            <p>Expert Trainers</p>
            <span>Certified professionals</span>
          </div>
          <div className="stat-card">
            <h2>95%</h2>
            <p>Success Rate</p>
            <span>Member satisfaction</span>
          </div>
        </div>

        <div className="features-section">
          <h2>Why Choose ActiveCore?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format" alt="Gym Equipment" />
              <h3>State-of-the-art Equipment</h3>
              <p>Access to premium fitness equipment</p>
            </div>
            <div className="feature-card">
              <img src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&auto=format" alt="Personal Training" />
              <h3>Expert Training</h3>
              <p>Work with certified trainers</p>
            </div>
            <div className="feature-card">
              <img src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=500&auto=format" alt="Gym Facilities" />
              <h3>Modern Facilities</h3>
              <p>Clean and spacious environment</p>
            </div>
          </div>
        </div>

        {/* Learn More Modal */}
        <IonModal isOpen={showLearnMore} onDidDismiss={() => setShowLearnMore(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>About ActiveCore</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowLearnMore(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <h2 style={{ color: '#00e676', marginTop: '1rem' }}>What is ActiveCore?</h2>
            <p>
              <strong>ActiveCore</strong> is a modern gym management and fitness tracking platform designed to help you achieve your health and wellness goals. With ActiveCore, you can:
            </p>
            <ul>
              <li>Track your gym attendance and progress</li>
              <li>Access personalized meal and workout plans</li>
              <li>Earn rewards for consistent attendance</li>
              <li>Connect with expert trainers and a supportive community</li>
              <li>Monitor your achievements and stay motivated</li>
            </ul>
            <p>
              Whether you're a beginner or a fitness enthusiast, ActiveCore provides the tools and support you need to succeed. Join us and start your transformation today!
            </p>
          </IonContent>
        </IonModal>

        {/* Login Modal */}
        <IonModal isOpen={showLogin} onDidDismiss={() => setShowLogin(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Login</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowLogin(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div className="login-form">
              {error && (
                <IonItem color="danger" lines="none">
                  <IonLabel>{error}</IonLabel>
                </IonItem>
              )}
              <IonItem>
                <IonLabel position="stacked">Email</IonLabel>
                <IonInput
                  type="email"
                  value={email}
                  onIonChange={e => setEmail(e.detail.value || '')}
                  placeholder="Enter your email"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Password</IonLabel>
                <IonInput
                  type="password"
                  value={password}
                  onIonChange={e => setPassword(e.detail.value || '')}
                  placeholder="Enter your password"
                />
              </IonItem>
              <div className="ion-padding-top">
                <IonButton expand="block" onClick={handleLogin}>
                  Log In
                </IonButton>
              </div>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Home;