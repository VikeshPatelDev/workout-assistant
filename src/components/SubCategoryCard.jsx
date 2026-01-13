function SubCategoryCard({ subCategory, onSelect }) {
  return (
    <button
      onClick={() => onSelect(subCategory)}
      className="w-full bg-gray-800 rounded-lg p-6 min-h-[120px] flex flex-col justify-center items-center text-center transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label={`View ${subCategory.label} exercises`}
    >
      <h3 className="text-lg md:text-xl font-bold text-white mb-2">
        {subCategory.label}
      </h3>
      <p className="text-sm text-gray-300">
        {subCategory.videos?.length || 0} videos
      </p>
    </button>
  );
}

export default SubCategoryCard;

