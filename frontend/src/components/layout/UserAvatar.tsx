interface UserAvatarProps {
  gender?: string | null;
  size?: number;
  className?: string;
}

type AvatarGender = "Male" | "Female" | "Other";

function normalizeGender(gender?: string | null): AvatarGender | null {
  const value = (gender ?? "").trim().toLowerCase();
  if (value === "male") {
    return "Male";
  }
  if (value === "female") {
    return "Female";
  }
  if (value === "other") {
    return "Other";
  }
  return null;
}

const AVATAR_SRC: Record<AvatarGender, string> = {
  Male: "/avatars/male.png",
  Female: "/avatars/female.png",
  Other: "/avatars/other.png",
};

/** Circular profile avatar for toolbar / account page. */
export function UserAvatar({
  gender,
  size = 36,
  className = "",
}: UserAvatarProps) {
  const resolved = normalizeGender(gender);
  const imgStyle = { width: size, height: size };

  if (resolved) {
    return (
      <img
        src={AVATAR_SRC[resolved]}
        alt=""
        width={size}
        height={size}
        style={imgStyle}
        className={`user-avatar-img ${className}`.trim()}
        draggable={false}
      />
    );
  }

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="31" fill="currentColor" opacity="0.08" />
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.35"
      />
      <circle cx="32" cy="24" r="9" fill="currentColor" opacity="0.55" />
      <path
        d="M14 52c4-12 10-17 18-17s14 5 18 17"
        fill="currentColor"
        opacity="0.55"
      />
    </svg>
  );
}
