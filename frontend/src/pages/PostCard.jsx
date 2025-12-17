export default function PostCard({ post }) {
  return (
    <div className="flex gap-3 p-4 border rounded-lg">
      
      {/* STATUS */}
      <div className="pt-1">
        {post.is_solved && (
          <CheckCircle size={20} className="text-green-600" />
        )}
      </div>

      {/* CONTENT */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {post.author.username}
          </span>

          {post.is_solved && (
            <span className="text-green-600 text-sm">
              Solved
            </span>
          )}
        </div>

        <h3 className="text-lg font-semibold">
          {post.title}
        </h3>

        <span className="text-xs text-gray-500">
          {post.category_name}
        </span>
      </div>
    </div>
  );
}