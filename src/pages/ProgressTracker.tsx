import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonButtons,
  IonBackButton,
  IonIcon,
} from '@ionic/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { calendar, analytics } from 'ionicons/icons';
import './ProgressTracker.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ProgressRecord {
  date: string;
  weight: number;
  bmi: number;
  notes: string;
}

const ProgressTracker: React.FC = () => {
  const [records, setRecords] = useState<ProgressRecord[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('progressRecords');
    if (stored) {
      setRecords(JSON.parse(stored));
    }
  }, []);

  const handleUpdate = () => {
    if (!weight || !bmi) {
      alert('Please enter both weight and BMI');
      return;
    }

    const newRecord: ProgressRecord = {
      date,
      weight: parseFloat(weight),
      bmi: parseFloat(bmi),
      notes
    };

    const updatedRecords = [...records, newRecord].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    setRecords(updatedRecords);
    localStorage.setItem('progressRecords', JSON.stringify(updatedRecords));
    clearForm();
  };

  const clearForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setWeight('');
    setBmi('');
    setNotes('');
  };

  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to delete all records?')) {
      setRecords([]);
      localStorage.removeItem('progressRecords');
      clearForm();
    }
  };

  const handleDeleteRecord = (index: number) => {
    if (window.confirm('Delete this record?')) {
      const updatedRecords = records.filter((_, i) => i !== index);
      setRecords(updatedRecords);
      localStorage.setItem('progressRecords', JSON.stringify(updatedRecords));
    }
  };

  const chartData: ChartData<'line'> = {
    labels: records.map(r => r.date),
    datasets: [
      {
        label: 'Weight (kg)',
        data: records.map(r => r.weight),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'BMI',
        data: records.map(r => r.bmi),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#ffffff',
          font: {
            size: 12
          },
          padding: 20
        }
      },
      title: {
        display: true,
        text: 'Progress Timeline',
        color: '#ffffff',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Weight (kg)',
          color: '#ffffff'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#ffffff',
          font: {
            size: 12
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'BMI',
          color: '#ffffff'
        },
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          color: '#ffffff',
          font: {
            size: 12
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#ffffff',
          font: {
            size: 12
          },
          maxRotation: 45
        }
      }
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/member" />
          </IonButtons>
          <IonTitle>Progress Tracker</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="form-container">
          <div className="form-section">
            <div className="form-section-title">
              <IonIcon icon={calendar} />
              <span>Date & Weight Details</span>
            </div>
            <IonItem>
              <IonLabel position="stacked">Date</IonLabel>
              <IonInput 
                type="date"
                value={date}
                onIonChange={e => setDate(e.detail.value!)}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Weight (kg)</IonLabel>
              <IonInput
                type="number"
                value={weight}
                onIonChange={e => setWeight(e.detail.value!)}
                placeholder="Enter your weight"
              />
            </IonItem>
          </div>

          <div className="form-section">
            <div className="form-section-title">
              <IonIcon icon={analytics} />
              <span>BMI & Notes</span>
            </div>
            <IonItem>
              <IonLabel position="stacked">BMI</IonLabel>
              <IonInput
                type="number"
                value={bmi}
                onIonChange={e => setBmi(e.detail.value!)}
                placeholder="Enter your BMI"
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Notes</IonLabel>
              <IonInput
                value={notes}
                onIonChange={e => setNotes(e.detail.value!)}
                placeholder="Add notes"
              />
            </IonItem>
          </div>
        </div>

        <div className="button-container">
          <IonButton onClick={clearForm} fill="outline">
            Clear Form
          </IonButton>
          <IonButton onClick={handleUpdate}>
            Update Progress
          </IonButton>
          <IonButton onClick={handleDeleteAll} color="danger" fill="outline">
            Delete All
          </IonButton>
        </div>

        {records.length > 0 && (
          <div className="chart-container">
            <Line data={chartData} options={chartOptions} />
          </div>
        )}

        {records.length > 0 && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Weight (kg)</th>
                  <th>BMI</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr key={index}>
                    <td>{record.date}</td>
                    <td>{record.weight}</td>
                    <td>{record.bmi}</td>
                    <td>{record.notes}</td>
                    <td>
                      <IonButton
                        fill="clear"
                        color="danger"
                        size="small"
                        onClick={() => handleDeleteRecord(index)}
                      >
                        Delete
                      </IonButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ProgressTracker;