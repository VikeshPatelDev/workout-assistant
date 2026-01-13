import CategoryGrid from '../components/CategoryGrid';
import workoutData from '../data/categorised_workout_v2.json';

function Home() {
  return (
    <div className="min-h-screen bg-gray-900">
      <CategoryGrid categories={workoutData.categories} />
    </div>
  );
}

export default Home;

