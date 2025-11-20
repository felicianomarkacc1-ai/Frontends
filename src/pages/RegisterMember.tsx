import React, { useEffect } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';
import './RegisterMember.css'; // ✅ Moved all styles here
import { Chart } from "chart.js";
const RegisterMember: React.FC = () => {
  useEffect(() => {
    // ✅ Load dynamic data after component mounts (previously done with <script>)
    const memberName = localStorage.getItem('memberName') || 'John Doe';
    const memberEmail = localStorage.getItem('memberEmail') || 'john.doe@email.com';
    const plan = localStorage.getItem('memberPlan') || 'Standard Plan';
    const memberSince = localStorage.getItem('membershipSince') || 'Jan 2024';
    const nextPayment = localStorage.getItem('nextPayment') || 'Oct 2025';
    const totalWorkouts = localStorage.getItem('totalWorkouts') || '12';
    const avgDuration = localStorage.getItem('avgDuration') || '45 mins';
    const calories = localStorage.getItem('caloriesBurned') || '3000';
    const attendanceRate = localStorage.getItem('attendanceRate') || '85%';

    (document.getElementById('memberName') as HTMLElement).innerText = memberName;
    (document.getElementById('memberEmail') as HTMLElement).innerText = memberEmail;
    (document.getElementById('memberPlan') as HTMLElement).innerText = plan;
    (document.getElementById('membershipDuration') as HTMLElement).innerText = memberSince;
    (document.getElementById('membershipExpiry') as HTMLElement).innerText = nextPayment;
    (document.getElementById('totalWorkouts') as HTMLElement).innerText = totalWorkouts;
    (document.getElementById('avgDuration') as HTMLElement).innerText = avgDuration;
    (document.getElementById('caloriesBurned') as HTMLElement).innerText = calories;
    (document.getElementById('attendance') as HTMLElement).innerText = attendanceRate;

    // ✅ Membership Progress Bar
    const progressEl = document.getElementById('membershipProgress') as HTMLElement;
    progressEl.style.width = '75%'; // Example: you can calculate based on real data

    // ✅ Button listeners
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
      localStorage.clear();
      window.location.href = '/login';
    });

    // ✅ Example: Chart rendering
   if (Chart) {
  const ctx1 = document.getElementById('workoutProgress') as HTMLCanvasElement;
  const ctx2 = document.getElementById('fitnessGoals') as HTMLCanvasElement;

  new Chart(ctx1, {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      datasets: [{ data: [3, 4, 2, 5, 4], borderColor: '#00e676', fill: false }]
    }
  });

  new Chart(ctx2, {
    type: 'doughnut',
    data: {
      labels: ['Achieved', 'Remaining'],
      datasets: [{ data: [70, 30], backgroundColor: ['#00e676', '#e2e8f0'] }]
    }
  });
}
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Register</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="member-page">
          <div className="profile-grid">
            {/* Profile Sidebar */}
            <aside className="profile-sidebar">
              <div className="profile-header">
                <div className="profile-avatar" id="memberAvatar">👤</div>
                <h1 className="profile-name" id="memberName"></h1>
                <div className="profile-email" id="memberEmail"></div>
              </div>

              <div className="membership-info">
                <div className="membership-header">
                  <h3>Membership Status</h3>
                  <span className="status-badge status-active" id="membershipStatus">
                    Active
                  </span>
                </div>
                <div className="membership-progress">
                  <div className="progress-bar" id="membershipProgress"></div>
                </div>
                <div className="membership-meta">
                  <div>
                    <div className="meta-label">Plan</div>
                    <div id="memberPlan"></div>
                  </div>
                  <div>
                    <div className="meta-label">Member Since</div>
                    <div id="membershipDuration"></div>
                  </div>
                  <div>
                    <div className="meta-label">Next Payment</div>
                    <div id="membershipExpiry"></div>
                  </div>
                  <div>
                    <div className="meta-label">Payment Status</div>
                    <div className="text-success">Paid</div>
                  </div>
                </div>
              </div>

              <div className="profile-actions">
                <button className="btn btn-primary" id="editProfileBtn">
                  <i className="fas fa-user-edit"></i> Edit Profile
                </button>
                <button className="btn btn-secondary" onClick={() => window.alert('Exported!')}>
                  <i className="fas fa-download"></i> Export Data
                </button>
                <button className="btn btn-secondary" id="logoutBtn">
                  <i className="fas fa-sign-out-alt"></i> Logout
                </button>
              </div>
            </aside>

            {/* Main Content */}
            <main className="profile-content">
              {/* Statistics Section */}
              <section className="content-section">
                <div className="section-header">
                  <h2 className="section-title">Fitness Overview</h2>
                </div>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value" id="totalWorkouts"></div>
                    <div className="stat-label">Total Workouts</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" id="avgDuration"></div>
                    <div className="stat-label">Avg. Duration</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" id="caloriesBurned"></div>
                    <div className="stat-label">Calories Burned</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" id="attendance"></div>
                    <div className="stat-label">Attendance Rate</div>
                  </div>
                </div>

                <div className="charts-grid">
                  <div className="chart-container">
                    <h3>Workout Progress</h3>
                    <canvas id="workoutProgress"></canvas>
                  </div>
                  <div className="chart-container">
                    <h3>Fitness Goals</h3>
                    <canvas id="fitnessGoals"></canvas>
                  </div>
                </div>
              </section>

              {/* Activity History */}
              <section className="content-section">
                <div className="section-header">
                  <h2 className="section-title">Recent Activities</h2>
                  <a href="#" className="btn btn-secondary">View All</a>
                </div>
                <div className="activity-history" id="activityHistory"></div>
              </section>
            </main>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default RegisterMember;