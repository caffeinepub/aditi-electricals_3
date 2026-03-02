import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUpdateWorker, useGetWorker } from '../hooks/useQueries';
import { ExternalBlob } from '../backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Camera, Image, User, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useCamera } from '../camera/useCamera';

export default function Profile() {
  const { user, updateUserName, updateUserPin, language, setLanguage } = useAuth();
  const workerId = user?.workerId || '';
  const { data: worker } = useGetWorker(workerId);
  const updateWorker = useUpdateWorker();

  const [name, setName] = useState(user?.name || '');
  const [nameSaving, setNameSaving] = useState(false);

  // PIN change
  const [pinOpen, setPinOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);

  // Photo
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const galleryRef = useRef<HTMLInputElement>(null);

  const { videoRef, canvasRef, isActive, startCamera, stopCamera, capturePhoto, isLoading: camLoading } = useCamera({ facingMode: 'environment' });

  const handleSaveName = async () => {
    if (!name.trim()) { toast.error('Name cannot be empty'); return; }
    setNameSaving(true);
    try {
      if (user?.role === 'worker' && worker) {
        await updateWorker.mutateAsync({
          workerId: worker.workerId,
          name: name.trim(),
          mobile: worker.mobile,
          monthlySalary: Number(worker.monthlySalary),
          pin: worker.pin,
          active: worker.active,
        });
      }
      updateUserName(name.trim());
      toast.success('Name updated successfully');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update name');
    } finally {
      setNameSaving(false);
    }
  };

  const handlePinChange = async () => {
    setPinError('');
    if (newPin.length < 4) { setPinError('PIN must be at least 4 digits'); return; }
    if (newPin !== confirmPin) { setPinError('PINs do not match'); return; }

    // Verify current PIN
    const storedPin = user?.pin || '';
    if (currentPin !== storedPin) { setPinError('Current PIN is incorrect'); return; }

    try {
      if (user?.role === 'worker' && worker) {
        await updateWorker.mutateAsync({
          workerId: worker.workerId,
          name: worker.name,
          mobile: worker.mobile,
          monthlySalary: Number(worker.monthlySalary),
          pin: newPin,
          active: worker.active,
        });
      }
      updateUserPin(newPin);
      setPinSuccess(true);
      setTimeout(() => {
        setPinSuccess(false);
        setPinOpen(false);
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
      }, 1500);
    } catch (e: any) {
      setPinError(e?.message || 'Failed to change PIN');
    }
  };

  const handleGallery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
    toast.success('Profile photo updated');
  };

  const handleCapture = async () => {
    const file = await capturePhoto();
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
    stopCamera();
    setShowCamera(false);
    toast.success('Profile photo captured');
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-2xl font-bold">Profile</h2>

      {/* Profile Photo */}
      <Card className="card-shadow border-0">
        <CardHeader><CardTitle className="text-lg">Profile Photo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-[var(--header-bg)] flex items-center justify-center overflow-hidden">
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-3xl font-bold">{(user?.name || 'U').charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setShowCamera(true); startCamera(); }}
              >
                <Camera className="w-4 h-4 mr-1" /> Camera
              </Button>
              <Button variant="outline" size="sm" onClick={() => galleryRef.current?.click()}>
                <Image className="w-4 h-4 mr-1" /> Gallery
              </Button>
              <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleGallery} />
            </div>
          </div>

          {showCamera && (
            <div className="space-y-2">
              <div className="relative rounded-lg overflow-hidden bg-black" style={{ minHeight: 200 }}>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto" />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCapture} disabled={!isActive || camLoading}>
                  {camLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Camera className="w-4 h-4 mr-1" />}
                  Capture
                </Button>
                <Button variant="outline" size="sm" onClick={() => { stopCamera(); setShowCamera(false); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Name */}
      <Card className="card-shadow border-0">
        <CardHeader><CardTitle className="text-lg">Display Name</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>
          <Button onClick={handleSaveName} disabled={nameSaving || updateWorker.isPending}>
            {(nameSaving || updateWorker.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Name
          </Button>
        </CardContent>
      </Card>

      {/* Language */}
      <Card className="card-shadow border-0">
        <CardHeader><CardTitle className="text-lg">Language / भाषा</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Marathi (मराठी)</p>
              <p className="text-xs text-muted-foreground">Switch between English and Marathi</p>
            </div>
            <Switch
              checked={language === 'mr'}
              onCheckedChange={v => setLanguage(v ? 'mr' : 'en')}
            />
          </div>
          {language === 'mr' && (
            <p className="text-sm text-muted-foreground mt-3 p-3 bg-muted/40 rounded-lg">
              मराठी भाषा निवडली आहे. (Marathi language selected.)
            </p>
          )}
        </CardContent>
      </Card>

      {/* PIN Change */}
      <Card className="card-shadow border-0">
        <CardHeader><CardTitle className="text-lg">Change PIN</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Update your login PIN (minimum 4 digits).</p>
          <Button variant="outline" onClick={() => setPinOpen(true)}>Change PIN</Button>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card className="card-shadow border-0">
        <CardHeader><CardTitle className="text-lg">Account Info</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Employee ID</span>
            <span className="font-medium">{user?.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium capitalize">{user?.role}</span>
          </div>
        </CardContent>
      </Card>

      {/* PIN Change Dialog */}
      <Dialog open={pinOpen} onOpenChange={v => { if (!v) { setPinOpen(false); setPinError(''); setCurrentPin(''); setNewPin(''); setConfirmPin(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Change PIN</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Current PIN</Label>
              <Input type="password" value={currentPin} onChange={e => setCurrentPin(e.target.value)} placeholder="Enter current PIN" />
            </div>
            <div className="space-y-2">
              <Label>New PIN (min 4 digits)</Label>
              <Input type="password" value={newPin} onChange={e => setNewPin(e.target.value)} placeholder="Enter new PIN" maxLength={8} />
            </div>
            <div className="space-y-2">
              <Label>Confirm New PIN</Label>
              <Input type="password" value={confirmPin} onChange={e => setConfirmPin(e.target.value)} placeholder="Confirm new PIN" maxLength={8} />
            </div>
            {pinError && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />{pinError}
              </div>
            )}
            {pinSuccess && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                <CheckCircle className="w-4 h-4 shrink-0" />PIN changed successfully!
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPinOpen(false)}>Cancel</Button>
            <Button onClick={handlePinChange} disabled={updateWorker.isPending}>
              {updateWorker.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Change PIN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
