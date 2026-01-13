"use client";

interface PolicyCommentProps {
  text: string;
  userName: string;
  createdAt: string;
}

export default function PolicyComment({
  text,
  userName,
  createdAt,
}: PolicyCommentProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4 rounded-lg border border-border-hr bg-bg-inner">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">
          {userName}
        </span>
        <span className="text-xs text-text-secondary">
          {formatDate(createdAt)}
        </span>
      </div>
      <p className="text-sm text-text-primary whitespace-pre-wrap">{text}</p>
    </div>
  );
}
