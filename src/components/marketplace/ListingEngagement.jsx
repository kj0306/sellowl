import { useState, useEffect } from "react";
import { toggleListingLike, fetchListingComments, postListingComment } from "../../lib/api";

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 2) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

/**
 * Likes, comments (public thread), and direct message to seller — backed by listing_likes / listing_comments.
 */
export default function ListingEngagement({
  listing,
  currentUserId,
  onMessage,
  onStatsChange,
  hideDirectMessage = false,
  className = "",
}) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);

  const likeCount = listing.like_count ?? 0;
  const commentCount = listing.comment_count ?? 0;
  const liked = !!listing.liked_by_me;

  useEffect(() => {
    if (!commentsOpen || !listing?.id) return;
    setLoadingComments(true);
    fetchListingComments(listing.id)
      .then((d) => setComments(d.comments || []))
      .catch(() => setComments([]))
      .finally(() => setLoadingComments(false));
  }, [commentsOpen, listing.id]);

  const handleLike = async () => {
    if (!currentUserId) {
      window.alert("Log in to like listings.");
      return;
    }
    setLikeBusy(true);
    try {
      const d = await toggleListingLike(listing.id);
      onStatsChange?.({
        like_count: d.like_count,
        liked_by_me: d.liked,
      });
    } catch (e) {
      window.alert(e.message || "Could not update like");
    } finally {
      setLikeBusy(false);
    }
  };

  const handlePostComment = async () => {
    const t = commentText.trim();
    if (!currentUserId) {
      window.alert("Log in to comment.");
      return;
    }
    if (!t) return;
    setPosting(true);
    try {
      const d = await postListingComment(listing.id, t);
      setCommentText("");
      if (d.comment) setComments((c) => [...c, d.comment]);
      if (typeof d.comment_count === "number") {
        onStatsChange?.({ comment_count: d.comment_count });
      } else {
        onStatsChange?.({ comment_count: commentCount + 1 });
      }
    } catch (e) {
      window.alert(e.message || "Could not post comment");
    } finally {
      setPosting(false);
    }
  };

  const openDm = () => {
    onMessage?.({
      id: listing.seller_id,
      name: listing.seller_name,
    });
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          disabled={likeBusy}
          onClick={handleLike}
          className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-[#3d2c1e]/10 dark:hover:bg-[#f8f4ed]/10 disabled:opacity-50"
          aria-label={liked ? "Unlike" : "Like"}
        >
          <span className="text-xl">{liked ? "❤️" : "🤍"}</span>
          <span className="text-xs font-semibold text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70">
            {likeCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCommentsOpen((o) => !o)}
          className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-[#3d2c1e]/10 dark:hover:bg-[#f8f4ed]/10"
          aria-expanded={commentsOpen}
        >
          <span className="text-xl">💬</span>
          <span className="text-xs font-semibold text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70">
            {commentCount} {commentCount === 1 ? "comment" : "comments"}
          </span>
        </button>

        {!hideDirectMessage && (
          <button
            type="button"
            onClick={openDm}
            className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-[#3d2c1e]/10 dark:hover:bg-[#f8f4ed]/10"
            title="Message seller"
          >
            <span className="text-xl">✉️</span>
            <span className="text-xs font-semibold text-[#d4a017]">Message</span>
          </button>
        )}
      </div>

      {commentsOpen && (
        <div className="mt-3 pl-1 border-l-2 border-[#d4a017]/30 space-y-3">
          {loadingComments ? (
            <p className="text-xs text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50 py-2">Loading comments…</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50 py-1">
              No comments yet. Be the first to ask a question publicly.
            </p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {comments.map((c) => (
                <li key={c.id} className="text-sm">
                  <span className="font-semibold text-[#1a1612] dark:text-[#f8f4ed]">
                    {c.author_name || "Member"}
                  </span>
                  <span className="text-[#3d2c1e]/40 dark:text-[#f8f4ed]/40 text-xs ml-2">
                    {timeAgo(c.created_at)}
                  </span>
                  <p className="text-[#3d2c1e]/80 dark:text-[#f8f4ed]/80 mt-0.5 whitespace-pre-wrap break-words">
                    {c.body}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={currentUserId ? "Add a public comment…" : "Log in to comment"}
              disabled={!currentUserId}
              rows={2}
              maxLength={2000}
              className="w-full text-sm rounded-lg border border-[#d4a017]/25 bg-[#f8f4ed] dark:bg-[#1a1612] text-[#1a1612] dark:text-[#f8f4ed] px-3 py-2 resize-none focus:ring-2 focus:ring-[#d4a017] focus:outline-none disabled:opacity-50"
            />
            <button
              type="button"
              disabled={!currentUserId || posting || !commentText.trim()}
              onClick={handlePostComment}
              className="self-start px-4 py-1.5 rounded-lg bg-[#d4a017] text-white text-xs font-semibold hover:bg-[#b8860b] disabled:opacity-40"
            >
              {posting ? "Posting…" : "Post comment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
