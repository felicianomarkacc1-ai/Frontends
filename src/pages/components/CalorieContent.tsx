import React, { useState } from "react";
import "../Calorie.css";

const CalorieContent: React.FC = () => {
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
        <div className="card"><strong>Maintain weight</strong><span className="highlight">{maintain} Calories/day</span></div>
        <div className="card"><strong>Mild weight loss</strong><span className="highlight">{mildLoss} Calories/day</span></div>
        <div className="card"><strong>Weight loss</strong><span className="highlight">{loss} Calories/day</span></div>
        <div className="card"><strong>Extreme weight loss</strong><span className="highlight">{extremeLoss} Calories/day</span></div>
        <div className="card"><strong>Mild weight gain</strong><span className="highlight">{mildGain} Calories/day</span></div>
        <div className="card"><strong>Weight gain</strong><span className="highlight">{gain} Calories/day</span></div>
      </div>
    );
  };

  return (
    <div className="container" style={{ margin: '0', maxWidth: '100%' }}>
      <h2>Calorie Calculator</h2>
      <label>Gender</label>
      <select value={gender} onChange={(e) => setGender(e.target.value)}>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>

      <label>Age (years)</label>
      <input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} />

      <label>Weight (kg)</label>
      <input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} />

      <label>Height (cm)</label>
      <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} />

      <label>Activity Level</label>
      <select value={activity} onChange={(e) => setActivity(Number(e.target.value))}>
        <option value={1.2}>Sedentary</option>
        <option value={1.375}>Light</option>
        <option value={1.55}>Moderate</option>
        <option value={1.725}>Active</option>
        <option value={1.9}>Very Active</option>
      </select>

      <button onClick={calculateCalories}>Calculate</button>
      {result}
    </div>
  );
};

export default CalorieContent;