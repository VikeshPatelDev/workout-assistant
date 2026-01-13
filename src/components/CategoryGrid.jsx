import { Link } from 'react-router-dom';

function CategoryGrid({ categories }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          to={`/category/${category.id}`}
          className="bg-gray-800 hover:bg-gray-700 text-white rounded-lg p-6 min-h-[120px] flex flex-col justify-center items-center text-center transition-colors active:bg-gray-600"
        >
          <h2 className="text-lg md:text-xl font-bold mb-2">
            {category.label}
          </h2>
          {category.description && (
            <p className="text-sm text-gray-300">
              {category.description}
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}

export default CategoryGrid;

