import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  useIonRouter,
} from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import "./Calorie.css";

const Calorie: React.FC = () => {
  const router = useIonRouter();
  const [gender, setGender] = useState("male");
  const [age, setAge] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [activity, setActivity] = useState(1.2);
  const [result, setResult] = useState<React.ReactNode | null>(null);

  const calculateCalories = () => {
    if (!age || !weight || !height) {
      setResult(<p style={{ color: "red" }}>⚠️ Please fill all fields correctly.</p>);
      return;
    }

    let bmr =
      gender === "male"
        ? 10 * Number(weight) + 6.25 * Number(height) - 5 * Number(age) + 5
        : 10 * Number(weight) + 6.25 * Number(height) - 5 * Number(age) - 161;

    const maintain = Math.round(bmr * Number(activity));
    const mildLoss = Math.round(maintain * 0.9);
    const loss = Math.round(maintain * 0.79);
    const extremeLoss = Math.round(maintain * 0.59);
    const mildGain = Math.round(maintain * 1.1);
    const gain = Math.round(maintain * 1.21);

    setResult(
      <div className="results">
        <div className="card">
          <strong>Maintain weight</strong>
          <span className="highlight">{maintain} Calories/day</span>
        </div>
        <div className="card">
          <strong>Mild weight loss</strong>
          <span className="highlight">{mildLoss} Calories/day</span>
        </div>
        <div className="card">
          <strong>Weight loss</strong>
          <span className="highlight">{loss} Calories/day</span>
        </div>
        <div className="card">
          <strong>Extreme weight loss</strong>
          <span className="highlight">{extremeLoss} Calories/day</span>
        </div>
        <div className="card">
          <strong>Mild weight gain</strong>
          <span className="highlight">{mildGain} Calories/day</span>
        </div>
        <div className="card">
          <strong>Weight gain</strong>
          <span className="highlight">{gain} Calories/day</span>
        </div>
      </div>
    );
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => router.push("/member", "back")}>
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>Calorie Calculator</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="container">
          <h2>Calorie Calculator</h2>
          
          <label>Gender</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          <label>Age (years)</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
          />

          <label>Weight (kg)</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
          />

          <label>Height (cm)</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
          />

          <label>Activity Level</label>
          <select
            value={activity}
            onChange={(e) => setActivity(Number(e.target.value))}
          >
            <option value={1.2}>Sedentary (little or no exercise)</option>
            <option value={1.375}>Light (exercise 1-3 times/week)</option>
            <option value={1.55}>Moderate (exercise 4-5 times/week)</option>
            <option value={1.725}>Active (daily exercise)</option>
            <option value={1.9}>Very Active (intense exercise 6-7 times/week)</option>
          </select>

          <button onClick={calculateCalories}>Calculate</button>
          {result}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Calorie;