export function serializeUser(user, boards = []) {
  return {
    id: user._id,
    email: user.email,
    username: user.username,
    avatar: user.avatar,
    bio: user.bio,
    interests: user.interests,
    savedPosts: user.savedPosts,
    boards
  };
}

export function serializePost(post) {
  return {
    id: post._id,
    content: post.content,
    mediaUrl: post.mediaUrl,
    mediaType: post.mediaType,
    tags: post.tags,
    boardIds: post.boardIds,
    likes: post.likes,
    comments: post.comments,
    isAnonymous: post.isAnonymous,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: post.author
  };
}
