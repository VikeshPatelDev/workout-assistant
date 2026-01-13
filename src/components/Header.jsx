import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="sticky top-0 z-50 bg-gray-900 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <Link to="/" className="text-2xl font-bold">
          Workout Assistant 💪
        </Link>
      </div>
    </header>
  );
}

export default Header;

