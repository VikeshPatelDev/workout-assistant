import SubCategoryCard from './SubCategoryCard';

function SubCategoryGrid({ subCategories, onSelectSubCategory }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {subCategories.map((subCategory) => (
        <SubCategoryCard
          key={subCategory.id}
          subCategory={subCategory}
          onSelect={onSelectSubCategory}
        />
      ))}
    </div>
  );
}

export default SubCategoryGrid;

