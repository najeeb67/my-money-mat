import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { PageTransition } from '@/components/PageTransition';
import { useAuth } from '@/contexts/AuthContext';
import { SoundButton } from '@/components/SoundButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Settings as SettingsIcon, 
  User, 
  Lock,
  Eye,
  EyeOff,
  Shield,
  Bell,
  Globe,
  Mail,
  Calendar,
  Smartphone,
  History,
  Download,
  Key,
  Clock,
  Languages,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
];

const timezones = [
  { code: 'PKT', name: 'Pakistan Standard Time (PKT)', offset: 'UTC+5' },
  { code: 'UTC', name: 'Coordinated Universal Time (UTC)', offset: 'UTC+0' },
  { code: 'EST', name: 'Eastern Standard Time (EST)', offset: 'UTC-5' },
  { code: 'PST', name: 'Pacific Standard Time (PST)', offset: 'UTC-8' },
  { code: 'GMT', name: 'Greenwich Mean Time (GMT)', offset: 'UTC+0' },
  { code: 'IST', name: 'India Standard Time (IST)', offset: 'UTC+5:30' },
];

const dateFormats = [
  { code: 'dd/MM/yyyy', example: '26/01/2026' },
  { code: 'MM/dd/yyyy', example: '01/26/2026' },
  { code: 'yyyy-MM-dd', example: '2026-01-26' },
  { code: 'dd MMM yyyy', example: '26 Jan 2026' },
];

export default function Settings() {
  const { user } = useAuth();
  
  // Password change state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Language & Region state
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedTimezone, setSelectedTimezone] = useState('PKT');
  const [selectedDateFormat, setSelectedDateFormat] = useState('dd/MM/yyyy');

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: true,
    budgetWarnings: true,
    weeklyReport: false,
    monthlyReport: true,
    securityAlerts: true,
  });

  // Security settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    setIsChangingPassword(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      toast.error('Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleExportData = () => {
    toast.success('Preparing your data export...', {
      description: 'You will receive an email with download link.',
    });
  };

  const handleNotificationChange = (key: keyof typeof notifications, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    toast.success(`${key.replace(/([A-Z])/g, ' $1').trim()} ${value ? 'enabled' : 'disabled'}`);
  };

  return (
    <Layout>
      <PageTransition>
        <div className="space-y-8 max-w-2xl">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
              <SettingsIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage your account & preferences</p>
            </div>
          </motion.div>

          {/* Account Information */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-display font-semibold">Account Information</h2>
            </div>

            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                    {user.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xl font-semibold capitalize">{user.username}</p>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{user.email}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                    <Shield className="h-5 w-5 text-income" />
                    <div>
                      <p className="text-sm text-muted-foreground">Account Status</p>
                      <p className="font-medium">{user.is_active ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Member Since</p>
                      <p className="font-medium">
                        {user.created_at && !isNaN(new Date(user.created_at).getTime()) 
                          ? format(new Date(user.created_at), 'MMM d, yyyy') 
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Loading account information...</p>
            )}
          </motion.div>

          {/* Change Password */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Key className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-display font-semibold">Change Password</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <SoundButton 
                onClick={handlePasswordChange} 
                disabled={isChangingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                className="w-full gap-2"
              >
                {isChangingPassword ? (
                  <>
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Changing Password...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Update Password
                  </>
                )}
              </SoundButton>
            </div>
          </motion.div>

          {/* Privacy & Security */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-display font-semibold">Privacy & Security</h2>
            </div>

            <div className="space-y-6">
              {/* Two-Factor Authentication */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add extra security to your account</p>
                  </div>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={(checked) => {
                    setTwoFactorEnabled(checked);
                    toast.success(checked ? '2FA enabled' : '2FA disabled');
                  }}
                />
              </div>

              <Separator />

              {/* Login History */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <History className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">Login History</p>
                    <p className="text-sm text-muted-foreground">View recent account activity</p>
                  </div>
                </div>
                <SoundButton variant="outline" size="sm">
                  View
                </SoundButton>
              </div>

              <Separator />

              {/* Export Data */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-income/10 flex items-center justify-center">
                    <Download className="h-5 w-5 text-income" />
                  </div>
                  <div>
                    <p className="font-medium">Export My Data</p>
                    <p className="text-sm text-muted-foreground">Download all your financial data</p>
                  </div>
                </div>
                <SoundButton variant="outline" size="sm" onClick={handleExportData}>
                  Export
                </SoundButton>
              </div>
            </div>
          </motion.div>

          {/* Language & Region */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Globe className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-display font-semibold">Language & Region</h2>
            </div>

            <div className="space-y-6">
              {/* Language Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Languages className="h-4 w-4" />
                  Language
                </Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <span className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Timezone Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Timezone
                </Label>
                <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz.code} value={tz.code}>
                        <span className="flex items-center gap-2">
                          <span className="text-muted-foreground text-xs">{tz.offset}</span>
                          <span>{tz.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Format Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date Format
                </Label>
                <Select value={selectedDateFormat} onValueChange={setSelectedDateFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select date format" />
                  </SelectTrigger>
                  <SelectContent>
                    {dateFormats.map((df) => (
                      <SelectItem key={df.code} value={df.code}>
                        <span className="flex items-center gap-2">
                          <span className="text-muted-foreground">{df.code}</span>
                          <span className="text-xs">({df.example})</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          {/* Notification Settings */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-display font-semibold">Notification Settings</h2>
            </div>

            <div className="space-y-4">
              {[
                { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive important alerts via email', icon: Mail },
                { key: 'pushNotifications', label: 'Push Notifications', desc: 'Get instant notifications on your device', icon: Bell },
                { key: 'budgetWarnings', label: 'Budget Warnings', desc: 'Alert when nearing budget limits', icon: Shield },
                { key: 'weeklyReport', label: 'Weekly Report', desc: 'Receive weekly financial summary', icon: Calendar },
                { key: 'monthlyReport', label: 'Monthly Report', desc: 'Receive monthly financial summary', icon: Calendar },
                { key: 'securityAlerts', label: 'Security Alerts', desc: 'Notify about suspicious activities', icon: Lock },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications[item.key as keyof typeof notifications]}
                    onCheckedChange={(checked) => handleNotificationChange(item.key as keyof typeof notifications, checked)}
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* App Info */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="text-center text-sm text-muted-foreground py-4"
          >
            <p>Zaroorat Pro Dashboard v1.0</p>
            <p>Your Personal Finance Assistant</p>
          </motion.div>
        </div>
      </PageTransition>
    </Layout>
  );
}
