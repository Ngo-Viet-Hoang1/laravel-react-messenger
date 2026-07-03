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
import { Hash, Loader2, Image as ImageIcon } from 'lucide-react';
import {
  createChannelSchema,
  type CreateChannelFormValues,
} from '../model/createChannelSchema';
import {
  useCreateChannelMutation,
  ChannelAvatar,
  type ChannelDetail,
} from '@/entities/channel';

export interface CreateChannelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChannelCreated?: (channel: ChannelDetail) => void;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  open,
  onOpenChange,
  onChannelCreated,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateChannelFormValues>({
    resolver: zodResolver(createChannelSchema),
    defaultValues: {
      name: '',
      description: '',
      avatarUrl: '',
    },
  });

  const previewName = watch('name');
  const previewAvatarUrl = watch('avatarUrl');

  const createMutation = useCreateChannelMutation({
    onSuccess: (newChannel) => {
      reset();
      onOpenChange(false);
      onChannelCreated?.(newChannel);
    },
  });

  const onSubmit = (values: CreateChannelFormValues) => {
    createMutation.mutate({
      name: values.name.trim(),
      description: values.description?.trim() || null,
      avatarUrl: values.avatarUrl?.trim() || null,
    });
  };

  const handleClose = () => {
    if (!createMutation.isPending) {
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => (!val ? handleClose() : onOpenChange(true))}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Hash className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Create a Channel
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Channels are where your team communicates around a shared topic.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          {/* Live Preview Avatar */}
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
            <ChannelAvatar
              channel={{
                name: previewName || 'Channel Name',
                type: 2,
                avatarUrl: previewAvatarUrl || null,
              }}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">
                {previewName || 'Channel Name'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Live preview of how this channel appears in the workspace
              </p>
            </div>
          </div>

          {/* Channel Name */}
          <div className="space-y-1.5">
            <Label htmlFor="create-channel-name" className="text-xs font-semibold">
              Name <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground text-xs font-mono select-none">
                #
              </span>
              <Input
                id="create-channel-name"
                {...register('name')}
                placeholder="e.g. engineering, general-discussion"
                className="pl-7 text-xs"
                disabled={createMutation.isPending}
                autoFocus
              />
            </div>
            {errors.name && (
              <p className="text-[11px] text-destructive font-medium">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="create-channel-desc" className="text-xs font-semibold">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="create-channel-desc"
              {...register('description')}
              placeholder="What is this channel about?"
              rows={3}
              className="text-xs resize-none"
              disabled={createMutation.isPending}
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
              <Label htmlFor="create-channel-avatar" className="text-xs font-semibold">
                Avatar URL <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
            </div>
            <Input
              id="create-channel-avatar"
              {...register('avatarUrl')}
              placeholder="https://example.com/logo.png"
              className="text-xs"
              disabled={createMutation.isPending}
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
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Channel'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
