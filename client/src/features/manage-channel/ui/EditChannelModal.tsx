import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import { Settings, Loader2, Image as ImageIcon } from 'lucide-react';
import {
  updateChannelSchema,
  type UpdateChannelFormValues,
} from '../model/updateChannelSchema';
import {
  useChannelDetailQuery,
  useUpdateChannelMutation,
  ChannelAvatar,
  type ChannelDetail,
} from '@/entities/channel';

export interface EditChannelModalProps {
  channelId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (channel: ChannelDetail) => void;
}

export const EditChannelModal: React.FC<EditChannelModalProps> = ({
  channelId = '',
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { data: channelDetail, isLoading: isLoadingDetail } = useChannelDetailQuery(
    open && channelId ? channelId : undefined
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<UpdateChannelFormValues>({
    resolver: zodResolver(updateChannelSchema),
    values: channelDetail
      ? {
          name: channelDetail.name,
          description: channelDetail.description ?? '',
          avatarUrl: channelDetail.avatarUrl ?? '',
        }
      : {
          name: '',
          description: '',
          avatarUrl: '',
        },
  });

  const previewName = watch('name');
  const previewAvatarUrl = watch('avatarUrl');

  const updateMutation = useUpdateChannelMutation(channelId, {
    onSuccess: (updatedChannel) => {
      onOpenChange(false);
      onSuccess?.(updatedChannel);
    },
  });

  const onSubmit = (values: UpdateChannelFormValues) => {
    updateMutation.mutate({
      name: values.name.trim(),
      description: values.description?.trim() || null,
      avatarUrl: values.avatarUrl?.trim() || null,
    });
  };

  const handleClose = () => {
    if (!updateMutation.isPending) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => (!val ? handleClose() : onOpenChange(true))}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Settings className="h-5 w-5" />
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Edit Channel Details
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Update channel name, topic description, or avatar icon.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoadingDetail ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            {/* Live Preview Avatar */}
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
              <ChannelAvatar
                channel={{
                  name: previewName || channelDetail?.name || 'Channel',
                  type: 2,
                  avatarUrl: previewAvatarUrl || channelDetail?.avatarUrl || null,
                }}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">
                  {previewName || channelDetail?.name || 'Channel Name'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Live preview of how this channel appears in the workspace
                </p>
              </div>
            </div>

            {/* Channel Name */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-channel-name" className="text-xs font-semibold">
                Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground text-xs font-mono select-none">
                  #
                </span>
                <Input
                  id="edit-channel-name"
                  {...register('name')}
                  placeholder="e.g. engineering, general-discussion"
                  className="pl-7 text-xs"
                  disabled={updateMutation.isPending}
                />
              </div>
              {errors.name && (
                <p className="text-[11px] text-destructive font-medium">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-channel-desc" className="text-xs font-semibold">
                Description <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="edit-channel-desc"
                {...register('description')}
                placeholder="What is this channel about?"
                rows={3}
                className="text-xs resize-none"
                disabled={updateMutation.isPending}
              />
              {errors.description && (
                <p className="text-[11px] text-destructive font-medium">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Avatar URL */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <Label htmlFor="edit-channel-avatar" className="text-xs font-semibold">
                  Avatar URL <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
              </div>
              <Input
                id="edit-channel-avatar"
                {...register('avatarUrl')}
                placeholder="https://example.com/logo.png"
                className="text-xs"
                disabled={updateMutation.isPending}
              />
              {errors.avatarUrl && (
                <p className="text-[11px] text-destructive font-medium">
                  {errors.avatarUrl.message}
                </p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!isDirty || updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
