/**
 * PWA Install Page
 * 
 * Dedicated page with instructions for installing the app
 * on different platforms (iOS, Android, Desktop).
 */

import { motion } from 'framer-motion';
import { 
  Download, 
  Share, 
  PlusSquare, 
  MoreVertical, 
  Smartphone, 
  Monitor,
  CheckCircle2,
  Zap,
  WifiOff,
  Bell,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { useNavigate } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Instant loading with cached resources',
  },
  {
    icon: WifiOff,
    title: 'Works Offline',
    description: 'Full functionality without internet',
  },
  {
    icon: Bell,
    title: 'Push Notifications',
    description: 'Get alerts for budget updates',
  },
  {
    icon: Smartphone,
    title: 'Native Feel',
    description: 'Looks and feels like a native app',
  },
];

export default function Install() {
  const { isInstallable, isIOS, isStandalone, promptInstall } = useInstallPrompt();
  const navigate = useNavigate();

  const handleInstallClick = async () => {
    if (isInstallable) {
      await promptInstall();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </motion.div>

        {/* Header */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center mb-12"
        >
          <motion.div variants={itemVariants} className="mb-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-4">
              <Download className="h-10 w-10 text-primary" />
            </div>
          </motion.div>
          
          <motion.h1 
            variants={itemVariants}
            className="text-4xl font-bold mb-4"
          >
            Install Budget Tracker
          </motion.h1>
          
          <motion.p 
            variants={itemVariants}
            className="text-xl text-muted-foreground max-w-xl mx-auto"
          >
            Get the full app experience with offline support, 
            faster loading, and easy access from your home screen.
          </motion.p>

          {isStandalone && (
            <motion.div variants={itemVariants} className="mt-6">
              <Badge variant="secondary" className="text-lg py-2 px-4">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                Already Installed
              </Badge>
            </motion.div>
          )}

          {isInstallable && !isStandalone && (
            <motion.div variants={itemVariants} className="mt-8">
              <Button size="lg" onClick={handleInstallClick} className="gap-2 text-lg px-8 py-6">
                <Download className="h-5 w-5" />
                Install Now
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <Card className="h-full text-center border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Installation Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Installation Instructions</CardTitle>
              <CardDescription>
                Choose your device type for step-by-step instructions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={isIOS ? 'ios' : 'android'} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="ios" className="gap-2">
                    <Smartphone className="h-4 w-4" />
                    iPhone/iPad
                  </TabsTrigger>
                  <TabsTrigger value="android" className="gap-2">
                    <Smartphone className="h-4 w-4" />
                    Android
                  </TabsTrigger>
                  <TabsTrigger value="desktop" className="gap-2">
                    <Monitor className="h-4 w-4" />
                    Desktop
                  </TabsTrigger>
                </TabsList>

                {/* iOS Instructions */}
                <TabsContent value="ios">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-primary">1</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Share className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold">Tap the Share button</h3>
                        </div>
                        <p className="text-muted-foreground">
                          Open this page in Safari and tap the <strong>Share</strong> icon 
                          at the bottom of the screen (square with arrow pointing up).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-primary">2</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <PlusSquare className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold">Add to Home Screen</h3>
                        </div>
                        <p className="text-muted-foreground">
                          Scroll down the share menu and tap <strong>"Add to Home Screen"</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-primary">3</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <h3 className="font-semibold">Confirm Installation</h3>
                        </div>
                        <p className="text-muted-foreground">
                          Tap <strong>"Add"</strong> in the top right corner. 
                          The app will now appear on your home screen!
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        <strong>Note:</strong> You must use Safari to install the app on iOS. 
                        Other browsers like Chrome don't support PWA installation on iPhone/iPad.
                      </p>
                    </div>
                  </div>
                </TabsContent>

                {/* Android Instructions */}
                <TabsContent value="android">
                  <div className="space-y-6">
                    {isInstallable ? (
                      <>
                        <div className="p-6 bg-primary/10 rounded-lg text-center">
                          <p className="text-lg mb-4">
                            Great news! Your browser supports direct installation.
                          </p>
                          <Button size="lg" onClick={handleInstallClick} className="gap-2">
                            <Download className="h-5 w-5" />
                            Install Now
                          </Button>
                        </div>
                        <p className="text-center text-muted-foreground">
                          Or follow the manual steps below:
                        </p>
                      </>
                    ) : null}

                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-primary">1</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MoreVertical className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold">Open Browser Menu</h3>
                        </div>
                        <p className="text-muted-foreground">
                          Tap the <strong>three dots</strong> (⋮) in the top right corner of Chrome.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-primary">2</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Download className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold">Install App</h3>
                        </div>
                        <p className="text-muted-foreground">
                          Look for <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong> in the menu.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-primary">3</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <h3 className="font-semibold">Confirm</h3>
                        </div>
                        <p className="text-muted-foreground">
                          Tap <strong>"Install"</strong> in the popup. 
                          The app icon will be added to your home screen.
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Desktop Instructions */}
                <TabsContent value="desktop">
                  <div className="space-y-6">
                    {isInstallable ? (
                      <>
                        <div className="p-6 bg-primary/10 rounded-lg text-center">
                          <p className="text-lg mb-4">
                            Click the button below to install the app on your computer.
                          </p>
                          <Button size="lg" onClick={handleInstallClick} className="gap-2">
                            <Download className="h-5 w-5" />
                            Install Now
                          </Button>
                        </div>
                        <p className="text-center text-muted-foreground">
                          Or follow the manual steps below:
                        </p>
                      </>
                    ) : null}

                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-primary">1</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Monitor className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold">Look for Install Icon</h3>
                        </div>
                        <p className="text-muted-foreground">
                          In Chrome or Edge, look for the <strong>install icon</strong> (➕) 
                          in the address bar on the right side.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-primary">2</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Download className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold">Click Install</h3>
                        </div>
                        <p className="text-muted-foreground">
                          Click the icon and then click <strong>"Install"</strong> in the popup dialog.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-primary">3</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <h3 className="font-semibold">Launch the App</h3>
                        </div>
                        <p className="text-muted-foreground">
                          The app will open in its own window. You can find it in your 
                          applications or pin it to your taskbar/dock.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Tip:</strong> For the best experience, use Chrome, Edge, or Brave browser.
                        Safari on macOS has limited PWA support.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-sm text-muted-foreground mt-8"
        >
          Having trouble? Make sure you're using a supported browser and try refreshing the page.
        </motion.p>
      </div>
    </div>
  );
}
