import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { UserAvatar, useUpdateProfileMutation, type User } from '@/entities/user';
import {
  updateProfileSchema,
  type UpdateProfileFormValues,
} from '../../model/updateProfileSchema';
import { Loader2 } from 'lucide-react';

export interface ProfileInfoTabProps {
  currentUser: User | null;
  onSuccess?: () => void;
}

const AVATAR_PRESETS = [
  { name: 'Alex', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alex' },
  { name: 'Morgan', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Morgan' },
  { name: 'Taylor', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Taylor' },
  { name: 'Jordan', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jordan' },
];

export const ProfileInfoTab: React.FC<ProfileInfoTabProps> = ({ currentUser, onSuccess }) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      username: currentUser?.username ?? '',
      avatarUrl: currentUser?.avatarUrl ?? '',
    },
  });

  const previewUsername = watch('username');
  const previewAvatarUrl = watch('avatarUrl');

  const updateProfileMutation = useUpdateProfileMutation({
    onSuccess: () => {
      onSuccess?.();
    },
  });

  const onSubmit = (values: UpdateProfileFormValues) => {
    updateProfileMutation.mutate({
      username: values.username.trim(),
      avatarUrl: values.avatarUrl?.trim() || null,
    });
  };

  const handleSelectPreset = (url: string) => {
    setValue('avatarUrl', url, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
      {/* Profile Header Preview */}
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
        <UserAvatar
          user={{
            username: previewUsername || currentUser?.username || 'User',
            avatarUrl: previewAvatarUrl || currentUser?.avatarUrl,
          }}
          size="md"
          className="shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {previewUsername || currentUser?.username || 'Your Name'}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {currentUser?.email || 'user@example.com'}
          </p>
        </div>
      </div>

      {/* Username */}
      <div className="space-y-1.5">
        <Label htmlFor="profile-username" className="text-xs font-semibold">
          Username <span className="text-destructive">*</span>
        </Label>
        <Input
          id="profile-username"
          {...register('username')}
          placeholder="johndoe"
          className="text-xs"
          disabled={updateProfileMutation.isPending}
        />
        {errors.username && (
          <p className="text-[11px] text-destructive font-medium">{errors.username.message}</p>
        )}
      </div>

      {/* Email (Readonly) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="profile-email" className="text-xs font-semibold">
            Email
          </Label>
          <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0">
            Verified
          </Badge>
        </div>
        <Input
          id="profile-email"
          value={currentUser?.email ?? ''}
          disabled
          className="text-xs bg-muted/40 cursor-not-allowed opacity-80"
        />
      </div>

      {/* Avatar URL & Quick Presets */}
      <div className="space-y-2">
        <Label htmlFor="profile-avatar" className="text-xs font-semibold">
          Avatar URL <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="profile-avatar"
          {...register('avatarUrl')}
          placeholder="https://example.com/avatar.png"
          className="text-xs"
          disabled={updateProfileMutation.isPending}
        />
        {errors.avatarUrl && (
          <p className="text-[11px] text-destructive font-medium">{errors.avatarUrl.message}</p>
        )}

        {/* Presets */}
        <div className="pt-0.5">
          <span className="text-[11px] text-muted-foreground block mb-1.5">
            Suggested avatars:
          </span>
          <div className="flex items-center gap-2">
            {AVATAR_PRESETS.map((preset) => {
              const isSelected = previewAvatarUrl === preset.url;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPreset(preset.url)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border p-1 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/10'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                  title={preset.name}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="h-full w-full rounded object-cover"
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          size="sm"
          disabled={!isDirty || updateProfileMutation.isPending}
          className="h-8 text-xs font-medium"
        >
          {updateProfileMutation.isPending ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  );
};
