import { useState } from "react";

import avatar1 from "../../assets/avatars/avatar-1.svg";
import avatar2 from "../../assets/avatars/avatar-2.svg";
import avatar3 from "../../assets/avatars/avatar-3.svg";
import avatar4 from "../../assets/avatars/avatar-4.svg";
import avatar5 from "../../assets/avatars/avatar-5.svg";
import avatar6 from "../../assets/avatars/avatar-6.svg";
import avatar7 from "../../assets/avatars/avatar-7.svg";
import avatar8 from "../../assets/avatars/avatar-8.svg";

const PRESET_AVATARS = [
  avatar1,
  avatar2,
  avatar3,
  avatar4,
  avatar5,
  avatar6,
  avatar7,
  avatar8,
];

const SIZES = {
  sm: 32,
  md: 48,
  lg: 96,
} as const;

export type AvatarSize = keyof typeof SIZES;

type AvatarProps = {
  userId: number;
  username: string | null;
  avatarUrl: string | null;
  size?: AvatarSize;
};

export function Avatar({
  userId,
  username,
  avatarUrl,
  size = "md",
}: AvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const preset = PRESET_AVATARS[userId % PRESET_AVATARS.length];
  const pixels = SIZES[size];

  const remote = avatarUrl !== null && failedUrl !== avatarUrl ? avatarUrl : null;
  const src = remote ?? preset;

  return (
    <img
      src={src}
      alt={username ?? "User"}
      width={pixels}
      height={pixels}
      className="rounded-circle"
      style={{ objectFit: "cover" }}
      onError={() => setFailedUrl(avatarUrl)}
    />
  );
}
