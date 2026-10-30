import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { useAppSelector } from '@/app/store';
import { selectCurrentUser } from '@/entities/user';
import { ProfileInfoTab } from './tabs/ProfileInfoTab';
import { SecuritySettingsTab } from './tabs/SecuritySettingsTab';

export interface ProfileSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  open,
  onOpenChange,
}) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const [activeTab, setActiveTab] = React.useState<'profile' | 'security'>('profile');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="text-left">
          <DialogTitle className="text-base font-bold text-foreground">
            Profile & Settings
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Manage your personal profile details and account security.
          </DialogDescription>
        </DialogHeader>

        {/* Clean Slack-style Navigation Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as typeof activeTab)}
          className="w-full pt-1"
        >
          <TabsList className="grid w-full grid-cols-2 h-8.5 bg-muted/60 p-0.5">
            <TabsTrigger
              value="profile"
              className="text-xs py-1 data-[state=active]:bg-background font-medium"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="text-xs py-1 data-[state=active]:bg-background font-medium"
            >
              Security
            </TabsTrigger>
          </TabsList>

          <div className="pt-3">
            {activeTab === 'profile' && (
              <ProfileInfoTab currentUser={currentUser} onSuccess={() => onOpenChange(false)} />
            )}
            {activeTab === 'security' && (
              <SecuritySettingsTab onSuccess={() => onOpenChange(false)} />
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
