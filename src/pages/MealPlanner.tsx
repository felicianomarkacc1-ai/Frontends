import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonLabel,
  IonInput,
  IonSpinner,
  IonText,
  IonIcon,
  IonModal,
  IonButtons,
  IonTextarea,
  IonGrid,
  IonRow,
  IonCol,
  IonBackButton,
  IonAlert,
  useIonToast,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonSegment,
  IonSegmentButton,
} from "@ionic/react";
import {
  restaurant,
  fitness,
  calendar,
  save,
  close,
  refresh,
  nutrition,
  eye,
  trash,
  documents,
  flame,
  chevronForward,
  cart,
  bulb,
  warning,
  checkmarkCircle,
  listCircle,
  arrowForward,
  star,
  time,
} from "ionicons/icons";
import "./MealPlanner.css";

const API_URL = "http://localhost:3002/api";

interface Meal {
  name: string;
  ingredients: string[];
  portionSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  recipe: string;
  // AI or server-provided instructions text (optional)
  instructions?: string;
}

interface DayMeals {
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snack1: Meal;
  snack2: Meal;
}

interface DayPlan {
  day: string;
  meals: DayMeals;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
}

interface MealPlan {
  weekPlan: DayPlan[];
  shoppingList: {
    proteins: string[];
    vegetables: string[];
    carbs: string[];
    others: string[];
  };
  mealPrepTips: string[];
  nutritionTips: string[];
}

interface SavedMealPlan {
  id: number;
  plan_name: string;
  plan_data: MealPlan;
  generated_at: string;
  is_active: boolean;
}

const MealPlanner: React.FC = () => {
  // Form State
  const [lifestyle, setLifestyle] = useState<string>("moderate");
  const [mealType, setMealType] = useState<string>("balanced");
  const [goal, setGoal] = useState<string>("muscle_gain");
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string>("");
  const [calorieTarget, setCalorieTarget] = useState<number>(2000);
  const [proteinTarget, setProteinTarget] = useState<number>(150);
  const [carbsTarget, setCarbsTarget] = useState<number>(200);
  const [fatsTarget, setFatsTarget] = useState<number>(60);

  // UI State
  const [loading, setLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<any | null>(null);
  const [showPreferencesForm, setShowPreferencesForm] = useState(true);
  const [activeTab, setActiveTab] = useState<"week" | "today">("today");

  // Save/Edit features
  const [savedPlans, setSavedPlans] = useState<SavedMealPlan[]>([]);
  const [showSavedPlans, setShowSavedPlans] = useState<boolean>(false);
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [planName, setPlanName] = useState('');
  const [showDeleteAlert, setShowDeleteAlert] = useState<boolean>(false);
  const [planToDelete, setPlanToDelete] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingMeal, setEditingMeal] = useState<{
    dayIndex: number;
    mealType: keyof DayMeals;
  } | null>(null);
  
  const [presentToast] = useIonToast();

  useEffect(() => {
    loadPreferences();
    loadSavedPlans();
  }, []);

  const loadPreferences = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/meal-planner/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success && data.hasPreferences) {
        const pref = data.preferences;
        setLifestyle(pref.lifestyle);
        setMealType(pref.mealType);
        setGoal(pref.goal);
        setDietaryRestrictions(pref.dietaryRestrictions || "");
        if (pref.targets) {
          setCalorieTarget(pref.targets.calories || 2000);
          setProteinTarget(pref.targets.protein || 150);
          setCarbsTarget(pref.targets.carbs || 200);
          setFatsTarget(pref.targets.fats || 60);
        }
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  async function checkBackendStatus(token?: string) {
    try {
      const resp = await fetch(`${process.env.REACT_APP_API_URL || API_URL}/system/status`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!resp.ok) {
        return { ok: false, status: resp.status, message: resp.statusText };
      }
      const data = await resp.json();
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, message: err?.message || String(err) };
    }
  }

  // Example handler: adjust to your variable names and state
  const generateMealPlan = async () => {
    setLoading(true);
    try {
      console.log('Starting mealplanner call: preparing request…');

      const token = localStorage.getItem('token') || '';
      if (!token) {
        presentToast({ message: '⚠️ Please log in before generating a meal plan.', duration: 2500, color: 'warning' });
        setLoading(false);
        return;
      }

      // Quick backend health check
      const status = await checkBackendStatus(token);
      if (!status.ok) {
        console.error('Backend health check failed:', status);
        presentToast({
          message: `⚠️ Backend unavailable: ${status.message ?? status.status}`,
          duration: 3500,
          color: 'danger'
        });
        setLoading(false);
        return;
      }

      const body = {
        lifestyle,
        mealType,
        goal,
        dietaryRestrictions,
        targets: {
          calories: calorieTarget,
          protein: proteinTarget,
          carbs: carbsTarget,
          fats: fatsTarget,
        },
      };

      const resp = await fetch(`${process.env.REACT_APP_API_URL || API_URL}/meal-planner/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body)
      });

      console.log('HTTP status:', resp.status);

      // Try to decode JSON safely
      let json: any = null;
      try {
        json = await resp.json();
      } catch (parseErr: any) {
        console.error('Response parsing failed, non-JSON returned:', parseErr?.message || parseErr);
      }

      if (!resp.ok) {
        // Prefer server-sent message, fallback to status text
        const msg = json?.message || json?.error || resp.statusText || `Request failed (${resp.status})`;
        console.warn('Meal planner generate failed:', msg, json);
        presentToast({ message: msg, duration: 4000, color: 'danger' });
        setLoading(false);
        return;
      }

      if (!json || !json.mealPlan) {
        console.warn('Invalid response structure from server:', json);
        presentToast({
          message: 'Server returned an unexpected response. Check console/network.',
          duration: 4000,
          color: 'warning'
        });
        setLoading(false);
        return;
      }

      const normalized = ensurePlanNormalized(json.mealPlan); // changed to normalized plan
      setMealPlan(normalized);
      setShowPreferencesForm(false);
      setActiveTab('today');

      presentToast({
        message: '🍽️ Your 7-day Filipino meal plan is ready!',
        duration: 3000,
        color: 'success',
      });
      console.log('Meal plan generated successfully:', json.mealPlan);
    } catch (err: any) {
      console.error('Meal plan generation error:', err);
      presentToast({
        message: `❌ ${err?.message || 'Failed to generate meal plan. Check console/network.'}`,
        duration: 5000,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper: categorize or normalize shopping list (server may return array or grouped object)
  const normalizeShoppingList = (raw: any) => {
    if (!raw) return { proteins: [], vegetables: [], carbs: [], others: [], flat: [] };

    // If server returns an array of {ingredient, estimate}
    if (Array.isArray(raw)) {
      const flat = raw.map((r) => ({ ingredient: r.ingredient ?? r.name ?? r, estimate: r.estimate ?? r.count ?? '1' }));
      return { proteins: [], vegetables: [], carbs: [], others: [], flat };
    }

    // If server returns grouped object
    return {
      proteins: raw.proteins || [],
      vegetables: raw.vegetables || [],
      carbs: raw.carbs || raw.carbs || [],
      others: raw.others || raw.others || [],
      flat: []
    };
  };

  // Update loadSavedPlans to handle rows with/without updatedAt
  const loadSavedPlans = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/meal-planner/plans`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setSavedPlans(
          data.plans.map((r: any) => ({
            id: r.id,
            plan_name: r.planName || r.plan_name,
            plan_data: r.plan_data || null,
            generated_at: r.generatedAt || r.generated_at || null,
            is_active: !!r.is_active
          }))
        );
      } else {
        // no plans or backend returned an error — show none
        setSavedPlans([]);
      }
    } catch (error) {
      console.error("Failed to load saved plans:", error);
      setSavedPlans([]);
    }
  };

  // Load single saved plan by id (calls backend /plans/:id)
  const loadSavedPlanById = async (planId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/meal-planner/plans/${planId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && data.plan && data.plan.data) {
        const normalizedPlan = ensurePlanNormalized(data.plan.data); // ensure normalized
        setMealPlan(normalizedPlan);
        setCurrentPlanId(planId);
        setShowSavedPlans(false);
        setShowPreferencesForm(false);
        setActiveTab("today");
        presentToast({ message: `📋 Loaded: ${data.plan.name}`, duration: 2000, color: "success" });
      } else {
        presentToast({ message: `Failed to load plan (${response.status})`, duration: 2500, color: "danger" });
      }
    } catch (err) {
      console.error("Failed to load saved plan:", err);
      presentToast({ message: "Failed to load saved plan", duration: 2000, color: "danger" });
    }
  };

  // Save meal plan - use backend expected fields (planName, mealPlan)
  const saveMealPlan = async () => {
    if (!mealPlan) return;

    try {
      const token = localStorage.getItem("token");
      const body = {
        planId: currentPlanId || undefined,
        planName: planName || `${goal} - ${mealType} Plan`,
        mealPlan: mealPlan.weekPlan || mealPlan // backend expects array of days in `mealPlan`
      };

      const response = await fetch(`${API_URL}/meal-planner/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (data.success) {
        setCurrentPlanId(data.planId || data.planId || null);
        setShowSaveModal(false);
        setPlanName("");
        await loadSavedPlans();
        presentToast({
          message: data.message || "✅ Meal plan saved successfully!",
          duration: 2000,
          color: "success",
        });
      } else {
        presentToast({ message: data.message || "Failed to save meal plan", duration: 2500, color: "danger" });
      }
    } catch (error) {
      console.error("Save failed:", error);
      presentToast({
        message: "❌ Failed to save meal plan",
        duration: 2000,
        color: "danger",
      });
    }
  };

  // Delete meal plan: call /meal-planner/plans/:id (backend path)
  const deleteMealPlan = async (planId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/meal-planner/plans/${planId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        await loadSavedPlans();
        if (currentPlanId === planId) {
          setCurrentPlanId(null);
          setMealPlan(null);
          setShowPreferencesForm(true);
        }
        presentToast({
          message: "🗑️ Meal plan deleted",
          duration: 2000,
          color: "success",
        });
      } else {
        presentToast({ message: data.message || "Failed to delete plan", duration: 2000, color: "danger" });
      }
    } catch (error) {
      presentToast({
        message: "❌ Failed to delete meal plan",
        duration: 2000,
        color: "danger",
      });
    }
  };

  const loadSavedPlan = (plan: SavedMealPlan) => {
    // Load via id to get full data
    loadSavedPlanById(plan.id);
  };

  // UI helper: show a short list of ingredients for preview
  const normalizeIngredientsToArray = (ings: any): string[] => {
    if (!ings) return [];
    if (Array.isArray(ings)) return ings as string[];

    if (typeof ings === "string") {
      // Try JSON parse first (some server responses store JSON array as string)
      try {
        const parsed = JSON.parse(ings);
        if (Array.isArray(parsed)) return parsed as string[];
      } catch { /* ignore parse error */ }

      // split by newlines, commas, semicolons
      return ings.split(/[\r\n,;]+/).map(s => s.trim()).filter(Boolean);
    }

    // If object with keys, try to stringify to array or use values
    if (typeof ings === "object") {
      try {
        const vals = Object.values(ings).flat();
        return vals.map(String).map(s => s.trim()).filter(Boolean);
      } catch { /* ignore */ }
    }

    return [];
  };

  // Update ingredientPreview to coerce inputs
  const ingredientPreview = (ingredients: any = [], max = 3) => {
    const arr = normalizeIngredientsToArray(ingredients);
    return arr.slice(0, max);
  };

  const getTodayDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  const todayPlan = mealPlan?.weekPlan?.find(d => d.day === getTodayDayName());

  const MacroProgress = ({ label, value, target, icon }: { label: string; value: number; target: number; icon: string }) => {
    const percentage = Math.min((value / target) * 100, 100);
    return (
      <div className="macro-item">
        <div className="macro-header">
          <span className="macro-icon">{icon}</span>
          <span className="macro-label">{label}</span>
        </div>
        <div className="macro-progress-bar">
          <div className="macro-progress-fill" style={{ width: `${percentage}%` }}></div>
        </div>
        <div className="macro-values">
          <span className="macro-value">{value}g</span>
          <span className="macro-target">{target}g</span>
        </div>
      </div>
    );
  };

  // Helper: derive concise instruction text from recipe when explicit instructions missing
  function generateInstructionFromRecipe(recipe?: string | null): string {
    if (!recipe) return '';
    const s = String(recipe || '').trim();
    const lines = s.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length > 0) return lines.slice(0, 4).join(' ');
    const sentences = s.split(/(?<=[.!?])\s+/).map(p => p.trim()).filter(Boolean);
    if (sentences.length > 0) return sentences.slice(0, 3).join(' ');
    return s.substring(0, 200);
  }

  // Normalize single meal values (ensures numeric macros, default portion size, converts string ingredients)
  function normalizeMeal(m: any): Meal {
    if (!m || typeof m !== 'object') {
      return {
        name: String(m || '') || 'Unknown dish',
        ingredients: [],
        portionSize: '1 serving',
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        recipe: '',
        instructions: '',
      } as Meal;
    }
    return {
      name: String(m.name || m.title || 'Unknown dish'),
      ingredients: normalizeIngredientsToArray(m.ingredients || m.ings || []),
      portionSize: String(m.portionSize || m.servings || '1 serving'),
      calories: Number(m.calories || m.cal || 0) || 0,
      protein: Number(m.protein || m.prot || 0) || 0,
      carbs: Number(m.carbs || m.carbohydrates || 0) || 0,
      fats: Number(m.fats || m.fat || 0) || 0,
      recipe: String(m.recipe || m.instructions || ''),
      instructions: String(m.instructions || m.ai_instructions || m.recipe || ''),
    } as Meal;
  }

  // Add helper to recompute day totals
  function recomputeDayTotals(dayPlan: DayPlan): DayPlan {
    const newTotals = Object.values(dayPlan.meals).reduce(
      (acc, m) => {
        acc.calories += Number(m.calories || 0);
        acc.protein += Number(m.protein || 0);
        acc.carbs += Number(m.carbs || 0);
        acc.fats += Number(m.fats || 0);
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
    return {
      ...dayPlan,
      totalCalories: newTotals.calories,
      totalProtein: newTotals.protein,
      totalCarbs: newTotals.carbs,
      totalFats: newTotals.fats,
    };
  }

  // Ensure plan is normalized (convert numbers, set instructions, recompute day totals)
  function ensurePlanNormalized(plan: any): MealPlan | null {
    if (!plan) return null;
    const weekArr = Array.isArray(plan.weekPlan) ? plan.weekPlan : (Array.isArray(plan) ? plan : []);
    const normalizedWeek = (weekArr as any[]).map((day: any) => {
      const mealsObj = { ...(day.meals || {}) };
      const mealKeys: (keyof DayMeals)[] = ['breakfast', 'lunch', 'dinner', 'snack1', 'snack2'];
      const newMeals: any = {};
      mealKeys.forEach((key) => {
        const raw = mealsObj[key] || {};
        const meal = normalizeMeal(raw);
        if (!meal.instructions || meal.instructions.trim() === '') {
          meal.instructions = generateInstructionFromRecipe(meal.recipe);
        }
        newMeals[key] = meal;
      });

      const updatedDay: DayPlan = {
        day: String(day.day || day.name || 'Day'),
        meals: newMeals,
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFats: 0,
      } as DayPlan;

      return recomputeDayTotals(updatedDay);
    });

    // Normalize shopping list if necessary
    const shoppingList = plan.shoppingList || { proteins: [], vegetables: [], carbs: [], others: [] };

    return {
      ...plan,
      weekPlan: normalizedWeek,
      shoppingList,
      mealPrepTips: plan.mealPrepTips || [],
      nutritionTips: plan.nutritionTips || [],
    } as MealPlan;
  }

  // Compute plan averages (returns rounded values)
  function computePlanAverages(plan: MealPlan | null) {
    if (!plan || !Array.isArray(plan.weekPlan) || plan.weekPlan.length === 0) return { avgCalories: 0, avgProtein: 0 };
    const total = plan.weekPlan.reduce(
      (acc, d) => {
        acc.calories += Number(d.totalCalories || 0);
        acc.protein += Number(d.totalProtein || 0);
        return acc;
      },
      { calories: 0, protein: 0 }
    );
    const count = plan.weekPlan.length || 1;
    return { avgCalories: Math.round(total.calories / count), avgProtein: Math.round(total.protein / count) };
  }

  // Prefer explicit AI instructions when available; fallback to recipe
  function getInstructionText(meal?: Meal | null): string | null {
    if (!meal) return null;
    if (meal.instructions && String(meal.instructions).trim()) return String(meal.instructions).trim();
    if (meal.recipe && String(meal.recipe).trim()) return String(meal.recipe).trim();
    return null;
  }

  // compute plan stats for display
  const planStats = computePlanAverages(mealPlan);

  // Helper: safely return normalized ingredients for a selected meal
  function getRecipeIngredients(sel: any): string[] {
    if (!sel) return [];
    const raw = sel?.meal?.ingredients ?? sel?.ingredients ?? [];
    return normalizeIngredientsToArray(raw);
  }
  // Use the existing selectedMeal state (do NOT redeclare it)
  const recipeIngredients = getRecipeIngredients(selectedMeal);

  // small helper - reuse existing normalizeMeal & recomputeDayTotals helpers in this file
  async function regenerateMeal(dayIndex: number, mealKey: keyof DayMeals) {
    if (!mealPlan) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";

      // API endpoint (use your API_URL constant that points to http://localhost:3002/api)
      const endpoint = `${API_URL}/meal-planner/regenerate`;

      // Current meal to exclude (avoid returning same meal)
      const currentMeal = mealPlan.weekPlan?.[dayIndex]?.meals?.[mealKey];
      const excludeNames = currentMeal?.name ? [String(currentMeal.name).trim()] : [];

      // Payload base - include current preferences & targets for AI context
      const baseBody = {
        dayIndex,
        mealType: mealKey,
        mealPlan: mealPlan.weekPlan ?? mealPlan,
        planId: currentPlanId ?? null,
        lifestyle,
        preference: mealType,
        goal,
        dietaryRestrictions,
        targets: {
          calories: calorieTarget,
          protein: proteinTarget,
          carbs: carbsTarget,
          fats: fatsTarget,
        },
      };

      let json: any = null;
      let attempt = 0;
      const maxAttempts = 3;
      let lastReturnedName: string | null = null;

      while (attempt < maxAttempts) {
        attempt += 1;
        const body = { ...baseBody, excludeMealNames: excludeNames.concat(lastReturnedName ? [lastReturnedName] : []) };
        try {
          const resp = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(body),
          });

          const txt = await resp.text().catch(() => "");
          try {
            json = txt ? JSON.parse(txt) : null;
          } catch {
            json = null;
          }

          if (!resp.ok) {
            // For 404 or HTML responses show helpful message and stop trying
            if (resp.status === 404 || (txt && txt.includes("<pre>Cannot POST"))) {
              presentToast({ message: `Server route not found: ${endpoint}`, duration: 3500, color: "danger" });
              console.error("Regenerate route not found. Response:", txt);
              return;
            }
            // For non-ok, try again if attempts left
            presentToast({ message: `Regenerate attempt ${attempt} failed (status ${resp.status}). Trying again...`, duration: 1800, color: "warning" });
            continue;
          }

          if (!json || !json.success) {
            // Server responded but not success - show message and break (or continue to try)
            const msg = json?.message || `Attempt ${attempt} failed - no success`;
            presentToast({ message: msg, duration: 3000, color: "warning" });
            // If server explicitly returned no-new-meal, break early
            if (json?.message?.toLowerCase()?.includes("already the same")) break;
            // otherwise try again
            continue;
          }

          // We got a successful response with a meal (handle multiple shapes)
          const rawNewMeal = json.newMeal ?? json.meal ?? json.generatedMeal ?? null;
          const newMealName = rawNewMeal?.name ? String(rawNewMeal.name).trim() : null;

          // If returned meal name is equal to one we're excluding, try again (on next attempt)
          if (newMealName && excludeNames.some(n => n.toLowerCase() === newMealName!.toLowerCase())) {
            lastReturnedName = newMealName;
            console.warn(`Regenerate attempt ${attempt} returned excluded meal "${newMealName}", re-trying...`);
            presentToast({ message: `Got same meal—retrying to find a different one...`, duration: 1200, color: "warning" });
            // small delay before retry
            await new Promise(r => setTimeout(r, 600));
            continue; // try again
          }

          // success and not excluded -> use it
          if (!rawNewMeal || !newMealName) {
            presentToast({ message: "Regenerate returned invalid meal", duration: 2500, color: "warning" });
            return;
          }

          const normalizedNewMeal = normalizeMeal(rawNewMeal);
          if (!normalizedNewMeal.instructions || normalizedNewMeal.instructions.trim() === "") {
            normalizedNewMeal.instructions = generateInstructionFromRecipe(normalizedNewMeal.recipe);
          }

          setMealPlan(prev => {
            if (!prev) return prev;
            const next = { ...prev };
            next.weekPlan = next.weekPlan.map((d, idx) => {
              if (idx !== dayIndex) return d;
              const updatedMeals = { ...d.meals, [mealKey]: normalizedNewMeal };
              return recomputeDayTotals({ ...d, meals: updatedMeals });
            });
            if (json.shoppingList) {
              next.shoppingList = normalizeShoppingList(json.shoppingList);
            }
            return next;
          });

          if (json.planId) setCurrentPlanId(json.planId);

          presentToast({ message: "🎉 Meal regenerated successfully", duration: 1600, color: "success" });
          setShowEditModal(false);
          setEditingMeal(null);
          return;
        } catch (err) {
          console.warn("Regenerate attempt error:", err);
          if (attempt < maxAttempts) {
            presentToast({ message: "Unexpected error — retrying...", duration: 1400, color: "warning" });
            await new Promise(r => setTimeout(r, 600));
            continue;
          } else {
            presentToast({ message: "Failed to regenerate meal — check the server logs", duration: 3000, color: "danger" });
            console.error("Final regenerate error:", err);
            return;
          }
        }
      }

      // Reached max attempts without success
      presentToast({ message: "Could not find a different meal after several tries.", duration: 3500, color: "warning" });
    } catch (err: any) {
      console.error("regenerateMeal error:", err);
      presentToast({
        message: "Error regenerating meal. Check console.",
        duration: 3000,
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <IonPage>
      <IonHeader className="meal-planner-header">
        <IonToolbar className="meal-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/member-dashboard" />
          </IonButtons>

          <IonTitle>
            <IonIcon icon={restaurant} className="header-icon" />
            Filipino Meal Planner
          </IonTitle>

          {/* Always show Save Plan button in header (visible when a plan exists) */}
          <IonButtons slot="end">
            <IonButton
              color="primary"
              onClick={() => setShowSaveModal(true)}
              disabled={!mealPlan} // only enabled when a plan is present
              className="save-plan-btn"
              >
              <IonIcon icon={save} slot="start" />
              {currentPlanId ? 'Update Plan' : 'Save Plan'}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Header Banner */}
        {!mealPlan && (
          <div className="meal-planner-hero">
            <div className="hero-content">
              <div className="hero-icon">🍽️</div>
              <h1>Filipino Meal Planner</h1>
              <p>AI-Powered Personalized Nutrition Plans</p>
            </div>
          </div>
        )}

        {/* Preferences Form */}
        {showPreferencesForm && !mealPlan && (
          <div className="preferences-section">
            <IonCard className="config-card">
              <IonCardContent>
                <h2 className="section-title">
                  <IonIcon icon={nutrition} /> Set Your Goals
                </h2>
                
                <div className="form-group">
                  <IonItem className="custom-item">
                    <IonLabel position="stacked">
                      <IonIcon icon={fitness} /> Lifestyle
                    </IonLabel>
                    <IonSelect value={lifestyle} onIonChange={(e) => setLifestyle(e.detail.value!)}>
                      <IonSelectOption value="sedentary">🛋️ Sedentary (Little/No Exercise)</IonSelectOption>
                      <IonSelectOption value="moderate">🚶 Moderate (Exercise 3-5x/week)</IonSelectOption>
                      <IonSelectOption value="active">🏃 Active (Exercise 6-7x/week)</IonSelectOption>
                    </IonSelect>
                  </IonItem>
                </div>

                <div className="form-group">
                  <IonItem className="custom-item">
                    <IonLabel position="stacked">
                      <IonIcon icon={restaurant} /> Meal Preference
                    </IonLabel>
                    <IonSelect value={mealType} onIonChange={(e) => setMealType(e.detail.value!)}>
                      <IonSelectOption value="balanced">⚖️ Balanced (Carbs, Protein, Fats)</IonSelectOption>
                      <IonSelectOption value="high_protein">💪 High Protein (Muscle Building)</IonSelectOption>
                      <IonSelectOption value="low_carb">🥗 Low Carb (Fat Loss)</IonSelectOption>
                    </IonSelect>
                  </IonItem>
                </div>

                <div className="form-group">
                  <IonItem className="custom-item">
                    <IonLabel position="stacked">
                      <IonIcon icon={flame} /> Fitness Goal
                    </IonLabel>
                    <IonSelect value={goal} onIonChange={(e) => setGoal(e.detail.value!)}>
                      <IonSelectOption value="muscle_gain">💪 Muscle Gain</IonSelectOption>
                      <IonSelectOption value="weight_loss">🔥 Weight Loss</IonSelectOption>
                      <IonSelectOption value="maintain">⚖️ Maintenance</IonSelectOption>
                    </IonSelect>
                  </IonItem>
                </div>

                {/* Allergies/Restrictions Section */}
                <div className="form-group">
                  <IonItem className="custom-item">
                    <IonLabel position="stacked">
                      <IonIcon icon={warning} style={{ color: "#ff9800" }} /> Allergies & Dietary Restrictions
                    </IonLabel>
                    <IonTextarea
                      placeholder="e.g., Allergic to seafood, shellfish, dairy, nuts, gluten-free, vegetarian..."
                      value={dietaryRestrictions}
                      onIonChange={(e) => setDietaryRestrictions(e.detail.value!)}
                      rows={3}
                      className="custom-textarea"
                    />
                  </IonItem>
                </div>
                {dietaryRestrictions && (
                  <div className="restriction-chip">
                    <IonIcon icon={checkmarkCircle} />
                    <IonLabel>Restrictions Applied</IonLabel>
                  </div>
                )}

                <div className="targets-section">
                  <h3 className="targets-title">
                    <IonIcon icon={flame} /> Daily Nutritional Targets
                  </h3>
                  
                  <IonGrid className="targets-grid">
                    <IonRow>
                      <IonCol size="6">
                        <div className="target-input-group">
                          <IonItem className="custom-item">
                            <IonLabel position="stacked">🔥 Calories</IonLabel>
                            <IonInput
                              type="number"
                              value={calorieTarget}
                              onIonChange={(e) => setCalorieTarget(Number(e.detail.value!))}
                              className="custom-input"
                            />
                          </IonItem>
                        </div>
                      </IonCol>
                      <IonCol size="6">
                        <div className="target-input-group">
                          <IonItem className="custom-item">
                            <IonLabel position="stacked">💪 Protein (g)</IonLabel>
                            <IonInput
                              type="number"
                              value={proteinTarget}
                              onIonChange={(e) => setProteinTarget(Number(e.detail.value!))}
                              className="custom-input"
                            />
                          </IonItem>
                        </div>
                      </IonCol>
                    </IonRow>
                    <IonRow>
                      <IonCol size="6">
                        <div className="target-input-group">
                          <IonItem className="custom-item">
                            <IonLabel position="stacked">🍚 Carbs (g)</IonLabel>
                            <IonInput
                              type="number"
                              value={carbsTarget}
                              onIonChange={(e) => setCarbsTarget(Number(e.detail.value!))}
                              className="custom-input"
                            />
                          </IonItem>
                        </div>
                      </IonCol>
                      <IonCol size="6">
                        <div className="target-input-group">
                          <IonItem className="custom-item">
                            <IonLabel position="stacked">🥑 Fats (g)</IonLabel>
                            <IonInput
                              type="number"
                              value={fatsTarget}
                              onIonChange={(e) => setFatsTarget(Number(e.detail.value!))}
                              className="custom-input"
                            />
                          </IonItem>
                        </div>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </div>

                <div className="button-group">
                  <IonButton
                    expand="block"
                    onClick={generateMealPlan}
                    disabled={loading}
                    className="generate-btn"
                  >
                    {loading ? (
                      <>
                        <IonSpinner name="crescent" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <IonIcon icon={calendar} slot="start" />
                        Generate 7-Day Plan
                      </>
                    )}
                  </IonButton>

                  {savedPlans.length > 0 && (
                    <IonButton
                      expand="block"
                      fill="outline"
                      onClick={() => setShowSavedPlans(true)}
                      className="secondary-btn"
                    >
                      <IonIcon icon={documents} slot="start" />
                      View Saved Plans ({savedPlans.length})
                    </IonButton>
                  )}
                </div>
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {/* Generated Meal Plan */}
        {mealPlan && !showPreferencesForm && (
          <div className="meal-plan-display">
            
            <div className="plan-header-card">
              <div className="success-badge">✅</div>
              <h2 className="plan-title">Your 7-Day Meal Plan</h2>
              <p className="plan-subtitle">
                <IonIcon icon={flame} />
                {planStats.avgCalories} cal/day
                &nbsp;•&nbsp;
                <IonIcon icon={nutrition} />
                {planStats.avgProtein}g protein (avg)
              </p>

              <div className="action-buttons">
                {/* Always show Save button; show 'Update' if already saved */}
                <IonButton
                  className="primary-btn"
                  onClick={() => setShowSaveModal(true)}
                  disabled={loading || !mealPlan}
                  style={{ marginRight: 8 }}
                >
                  <IonIcon icon={save} slot="start" />
                  {currentPlanId ? "Update Plan" : "Save Plan"}
                </IonButton>

                <IonButton
                  className="secondary-btn"
                  onClick={() => {
                    setShowPreferencesForm(true);
                    setMealPlan(null);
                    setActiveTab("today");
                    setCurrentPlanId(null);
                  }}
                >
                  <IonIcon icon={refresh} slot="start" />
                  New Plan
                </IonButton>
              </div>
            </div>

            {/* Segment Control */}
            <div className="segment-wrapper">
              <IonSegment value={activeTab} onIonChange={(e) => setActiveTab(e.detail.value as "today" | "week")}>
                <IonSegmentButton value="today">
                  <IonIcon icon={time} />
                  Today
                </IonSegmentButton>
                <IonSegmentButton value="week">
                  <IonIcon icon={calendar} />
                  Full Week
                </IonSegmentButton>
              </IonSegment>
            </div>

            {/* Today's Plan */}
            {activeTab === "today" && todayPlan && (
              <div className="today-view">
                <IonCard className="today-card">
                  <IonCardHeader>
                    <IonCardTitle className="today-title">
                      <IonIcon icon={calendar} />
                      Today - {todayPlan.day}
                    </IonCardTitle>
                    <p className="today-stats">
                      <IonIcon icon={flame} /> {todayPlan.totalCalories} cal | 
                      <IonIcon icon={nutrition} /> {todayPlan.totalProtein}g protein
                    </p>
                  </IonCardHeader>
                  <IonCardContent>
                    {Object.entries(todayPlan.meals).map(([mealTypeKey, meal]) => {
                      const mealIcons: Record<string, string> = {
                        breakfast: "🌅",
                        lunch: "🌞",
                        dinner: "🌙",
                        snack1: "🍎",
                        snack2: "🍪"
                      };

                      // ensure meal fields exist
                      const mealObj = {
                        ...(meal || {}),
                        ingredients: normalizeIngredientsToArray((meal as any)?.ingredients)
                      };

                      return (
                        <div key={mealTypeKey} className="meal-item today-meal">
                          <div className="meal-header">
                            <h3 className="meal-name">
                              {mealIcons[mealTypeKey]} {mealTypeKey.charAt(0).toUpperCase() + mealTypeKey.slice(1).replace(/\d/, ' $&')}
                            </h3>
                            <span className="meal-calories">{mealObj.calories ?? 0} cal</span>
                          </div>
                          <p className="meal-dish-name">{mealObj.name}</p>

                          {/* quick preview of ingredients */}
                          {Array.isArray(mealObj.ingredients) && mealObj.ingredients.length > 0 && (
                            <p style={{ color: "#b0b0b0", margin: "0.25rem 0" }}>
                              Ingredients: {ingredientPreview(mealObj.ingredients).join(", ")}{mealObj.ingredients.length > 3 ? "…" : ""}
                            </p>
                          )}

                          {/* portion & recipe snippet */}
                          <p style={{ color: "#b0b0b0", fontSize: "0.95rem", marginTop: 4 }}>
                            Portion: {mealObj.portionSize || "1 serving"} • {getInstructionText(mealObj) ? `${String(getInstructionText(mealObj)).slice(0, 80)}${String(getInstructionText(mealObj)).length > 80 ? "…" : ""}` : "No recipe/instructions provided"}
                          </p>

                          <div className="meal-macros">
                            <span><strong>💪</strong> {mealObj.protein ?? 0}g</span>
                            <span><strong>🍚</strong> {mealObj.carbs ?? 0}g</span>
                            <span><strong>🥑</strong> {mealObj.fats ?? 0}g</span>
                          </div>

                          <div className="meal-actions">
                            <IonButton
                              size="small"
                              fill="outline"
                              onClick={() => {
                                const dayIndex = mealPlan.weekPlan.findIndex(d => d.day === todayPlan.day);
                                setEditingMeal({ dayIndex, mealType: mealTypeKey as keyof DayMeals });
                                setShowEditModal(true);
                              }}
                              className="action-btn"
                            >
                              <IonIcon icon={refresh} slot="start" />
                              Regenerate
                            </IonButton>
                            <IonButton
                              size="small"
                              fill="clear"
                              onClick={() => {
                                setSelectedMeal({ day: todayPlan.day, mealType: mealTypeKey, meal: mealObj });
                                setShowRecipeModal(true);
                              }}
                              className="action-btn"
                            >
                              <IonIcon icon={eye} slot="start" />
                              Recipe
                            </IonButton>
                          </div>
                        </div>
                      );
                    })}
                  </IonCardContent>
                </IonCard>
              </div>
            )}

            {/* Full Week View - add ingredients snippet and portion size */}
            {activeTab === "week" && (
              <div className="week-view">
                {mealPlan.weekPlan.map((dayPlan, dayIndex) => (
                  <IonCard key={dayPlan.day} className="day-card">
                    <IonCardHeader>
                      <IonCardTitle className="day-title">{dayPlan.day}</IonCardTitle>
                      <p className="day-stats"><IonIcon icon={flame} />{dayPlan.totalCalories} cal ⋅ <IonIcon icon={nutrition} /> {dayPlan.totalProtein}g protein</p>
                    </IonCardHeader>
                    <IonCardContent>
                      {Object.entries(dayPlan.meals).map(([mealTypeKey, meal]) => {
                        const mealObj = {
                          ...(meal || {}),
                          ingredients: normalizeIngredientsToArray((meal as any)?.ingredients)
                        };
                        return (
                          <div key={mealTypeKey} className="meal-item">
                            <div className="meal-header" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: "1.5rem" }}>{{
                                breakfast: "🌅", lunch: "🌞", dinner: "🌙", snack1: "🍎", snack2: "🍪"
                              }[mealTypeKey]}</span>
                              <span className="meal-name" style={{ fontSize: "1.15rem", fontWeight: 700, color: "#00e676" }}>
                                {mealTypeKey.charAt(0).toUpperCase() + mealTypeKey.slice(1).replace(/\d/, ' $&')}
                              </span>
                            </div>

                            <div className="meal-dish-name" style={{ color: "#fff", fontSize: "1.35rem", fontWeight: 800 }}>
                              {mealObj.name}
                            </div>

                            <div className="meal-macros" style={{ color: "#b0b0b0", fontSize: "1rem", marginBottom: "0.5rem" }}>
                              <span>🔥 {mealObj.calories ?? 0} cal</span>
                              <span>💪 {mealObj.protein ?? 0}g protein</span>
                              <span>🍚 {mealObj.carbs ?? 0}g carbs</span>
                              <span>🥑 {mealObj.fats ?? 0}g fats</span>
                            </div>

                            {Array.isArray(mealObj.ingredients) && mealObj.ingredients.length > 0 && (
                              <p style={{ color: "#b0b0b0", margin: "0.25rem 0" }}>
                                Ingredients: {ingredientPreview(mealObj.ingredients).join(", ")}{mealObj.ingredients.length > 3 ? "…" : ""}
                              </p>
                            )}

                            <div className="meal-actions">
                              <IonButton
                                size="small"
                                fill="outline"
                                onClick={() => {
                                  setEditingMeal({ dayIndex, mealType: mealTypeKey as keyof DayMeals });
                                  setShowEditModal(true);
                                }}
                                className="action-btn"
                              >
                                <IonIcon icon={refresh} slot="start" />
                                Regenerate
                              </IonButton>
                              <IonButton
                                size="small"
                                fill="clear"
                                onClick={() => {
                                  setSelectedMeal({ day: dayPlan.day, mealType: mealTypeKey as keyof DayMeals, meal: mealObj });
                                  setShowRecipeModal(true);
                                }}
                                className="action-btn"
                              >
                                <IonIcon icon={eye} slot="start" />
                                Recipe
                              </IonButton>
                            </div>
                          </div>
                        );
                      })}
                    </IonCardContent>
                  </IonCard>
                ))}
              </div>
            )}

            {/* Shopping List & Tips: handle normalized formats */}
            {mealPlan && (
              <IonCard className="info-card shopping-card">
                <IonCardHeader>
                  <IonCardTitle><IonIcon icon={cart} /> Shopping List</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="shopping-list">
                    {/* If server returned grouped object */}
                    {mealPlan.shoppingList && !Array.isArray(mealPlan.shoppingList) && (
                      <>
                        {mealPlan.shoppingList.proteins?.length > 0 && (
                          <div className="shopping-category">
                            <h4><IonIcon icon={nutrition} /> Proteins</h4>
                            <ul className="shopping-items">
                              {mealPlan.shoppingList.proteins.map((item: any, idx: number) => (
                                <li key={idx}><IonIcon icon={checkmarkCircle} className="check-icon" /><span>{item}</span></li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {mealPlan.shoppingList.vegetables?.length > 0 && (
                          <div className="shopping-category">
                            <h4><IonIcon icon={nutrition} /> Vegetables</h4>
                            <ul className="shopping-items">
                              {mealPlan.shoppingList.vegetables.map((item: any, idx: number) => (
                                <li key={idx}><IonIcon icon={checkmarkCircle} className="check-icon" /><span>{item}</span></li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {mealPlan.shoppingList.carbs?.length > 0 && (
                          <div className="shopping-category">
                            <h4><IonIcon icon={nutrition} /> Carbs</h4>
                            <ul className="shopping-items">
                              {mealPlan.shoppingList.carbs.map((item: any, idx: number) => (
                                <li key={idx}><IonIcon icon={checkmarkCircle} className="check-icon" /><span>{item}</span></li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {mealPlan.shoppingList.others?.length > 0 && (
                          <div className="shopping-category">
                            <h4><IonIcon icon={nutrition} /> Others</h4>
                            <ul className="shopping-items">
                              {mealPlan.shoppingList.others.map((item: any, idx: number) => (
                                <li key={idx}><IonIcon icon={checkmarkCircle} className="check-icon" /><span>{item}</span></li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}

                    {/* If server returned flat array like [{ingredient, estimate}] */}
                    {mealPlan.shoppingList && Array.isArray(mealPlan.shoppingList) && (
                      <div className="shopping-category">
                        <h4><IonIcon icon={cart} /> Ingredients</h4>
                        <ul className="shopping-items">
                          {mealPlan.shoppingList.map((item: any, idx: number) => (
                            <li key={idx}><IonIcon icon={checkmarkCircle} className="check-icon" /><span>{item.ingredient ?? item}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </IonCardContent>
              </IonCard>
            )}

            {/* Meal Prep Tips & Nutrition Tips */}
            {mealPlan.mealPrepTips && (
              <IonCard className="info-card tips-card">
                <IonCardHeader>
                  <IonCardTitle><IonIcon icon={bulb} /> Meal Prep Tips</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <ul className="tips-list">
                    {mealPlan.mealPrepTips.map((tip, idx) => (
                      <li key={idx}><IonIcon icon={listCircle} className="tip-icon" /><span>{tip}</span></li>
                    ))}
                  </ul>
                </IonCardContent>
              </IonCard>
            )}
          </div>
        )}

        {/* Regenerate Modal */}
        <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)} className="custom-modal">
          <IonHeader className="modal-header">
            <IonToolbar>
              <IonTitle>Regenerate Meal</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowEditModal(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {editingMeal && (
              <div className="modal-content">
                <p className="modal-info">
                  Regenerating: <strong>{mealPlan?.weekPlan[editingMeal.dayIndex]?.day} - {editingMeal.mealType}</strong>
                </p>
                <p className="modal-description">
                  This will generate a DIFFERENT Filipino dish while keeping the same nutritional targets.
                </p>
                <IonButton
                  expand="block"
                  color="warning"
                  onClick={async () => {
                    if (editingMeal) {
                      await regenerateMeal(editingMeal.dayIndex, editingMeal.mealType);
                    }
                  }}
                  disabled={loading}
                  className="regenerate-btn"
                >
                  {loading ? (
                    <>
                      <IonSpinner name="crescent" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <IonIcon icon={refresh} slot="start" />
                      Generate Different Meal
                    </>
                  )}
                </IonButton>
              </div>
            )}
          </IonContent>
        </IonModal>

        {/* Recipe Modal */}
        <IonModal isOpen={showRecipeModal} onDidDismiss={() => setShowRecipeModal(false)} className="custom-modal">
          <IonHeader className="modal-header">
            <IonToolbar>
              <IonTitle>{selectedMeal?.meal.name}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowRecipeModal(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding recipe-modal">
            {selectedMeal && (
              <div className="recipe-content">
                <h3 className="recipe-title">{selectedMeal.day} - {selectedMeal.mealType.toUpperCase()}</h3>
                
                <div className="recipe-macros">
                  <div className="macro-card">
                    <span className="macro-icon">🔥</span>
                    <span className="macro-value">{selectedMeal.meal.calories} cal</span>
                  </div>
                  <div className="macro-card">
                    <span className="macro-icon">💪</span>
                    <span className="macro-value">{selectedMeal.meal.protein}g</span>
                  </div>
                  <div className="macro-card">
                    <span className="macro-icon">🍚</span>
                    <span className="macro-value">{selectedMeal.meal.carbs}g</span>
                  </div>
                  <div className="macro-card">
                    <span className="macro-icon">🥑</span>
                    <span className="macro-value">{selectedMeal.meal.fats}g</span>
                  </div>
                </div>

                <div className="recipe-section">
                  <h4 className="section-heading">Ingredients</h4>
                  <ul className="ingredients-list">
                    {/* Removed inline const; use recipeIngredients declared above */}
                    {recipeIngredients.map((ing, idx) => (
                      <li key={idx}>{ing}</li>
                    ))}
                  </ul>
                </div>

                {/* Show both recipe and AI-provided instructions when available */}
                {selectedMeal.meal.recipe && (
                  <div className="recipe-section">
                    <h4 className="section-heading">Recipe</h4>
                    <p className="recipe-text">{selectedMeal.meal.recipe}</p>
                  </div>
                )}
                {selectedMeal.meal.instructions && selectedMeal.meal.instructions !== selectedMeal.meal.recipe && (
                  <div className="recipe-section">
                    <h4 className="section-heading">AI Instructions</h4>
                    <p className="recipe-text">{selectedMeal.meal.instructions}</p>
                  </div>
                )}

                <div className="recipe-section">
                  <h4 className="section-heading">Portion Size</h4>
                  <p className="recipe-text">{selectedMeal.meal.portionSize}</p>
                </div>
              </div>
            )}
          </IonContent>
        </IonModal>

        {/* Save Modal */}
        <IonModal isOpen={showSaveModal} onDidDismiss={() => setShowSaveModal(false)} className="custom-modal">
          <IonHeader className="modal-header">
            <IonToolbar>
              <IonTitle>Save Meal Plan</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowSaveModal(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem>
              <IonLabel position="stacked">Plan name</IonLabel>
              <IonInput
                value={planName}
                placeholder="e.g., High Protein Week"
                onIonChange={(e: any) => setPlanName(e.detail?.value as string)}
              />
            </IonItem>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <IonButton
                color="primary"
                onClick={async () => {
                  await saveMealPlan(); // uses existing saveMealPlan() in file
                }}
                disabled={!mealPlan}
              >
                <IonIcon icon={save} slot="start" />
                Save
              </IonButton>

              <IonButton
                color="medium"
                fill="outline"
                onClick={() => setShowSaveModal(false)}
              >
                Cancel
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Saved Plans Modal */}
        <IonModal isOpen={showSavedPlans} onDidDismiss={() => setShowSavedPlans(false)} className="custom-modal">
          <IonHeader className="modal-header">
            <IonToolbar>
              <IonTitle>Saved Meal Plans</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowSavedPlans(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div className="saved-plans-list">
              {savedPlans.length === 0 ? (
                <div className="empty-state">
                  <p>No saved plans yet</p>
                </div>
              ) : (
                savedPlans.map((plan) => (
                  <IonCard key={plan.id} className="saved-plan-card">
                    <IonCardContent>
                      <h3 className="saved-plan-name">{plan.plan_name}</h3>
                      <p className="saved-plan-date">
                        <IonIcon icon={time} />
                        {new Date(plan.generated_at).toLocaleDateString()}
                      </p>
                      <div className="saved-plan-actions">
                        <IonButton size="small" onClick={() => loadSavedPlan(plan)} className="load-btn">
                          <IonIcon icon={eye} slot="start" />
                          Load
                        </IonButton>
                        <IonButton
                          size="small"
                          color="danger"
                          onClick={() => {
                            setPlanToDelete(plan.id);
                            setShowDeleteAlert(true);
                          }}
                          className="delete-btn"
                        >
                          <IonIcon icon={trash} slot="start" />
                          Delete
                        </IonButton>
                      </div>
                    </IonCardContent>
                  </IonCard>
                ))                )}
            </div>
          </IonContent>
        </IonModal>

        {/* Delete Alert */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header={"Confirm Delete"}
          message={"Are you sure you want to delete this meal plan? This action cannot be undone."}
          buttons={[
            { text: "Cancel", role: "cancel" },
            {
              text: "Delete",
              handler: async () => {
                if (planToDelete !== null) {
                  await deleteMealPlan(planToDelete);
                  setPlanToDelete(null);
                }
              },
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default MealPlanner;

// Remove duplicate helper definitions at the bottom of the file (if any).