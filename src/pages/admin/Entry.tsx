import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Loader2, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Layout } from '@/components/Layout';
import { FloatingInput } from '@/components/FloatingInput';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { generateGhatSlipPDF } from '@/utils/generateGhatSlipPDF';

const wheelsOptions = ['6', '10', '12', '14', '16', '18', '20', '22'];

export const Form = () => {
  const { addEntry, getNextSlNo, entries, currentUser, users, getBranchById } = useStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formKey, setFormKey] = useState(0); // Key to force re-render for slNo update
  const branch = currentUser.branchId ? getBranchById(currentUser.branchId) : null;
console.log('Current Branch in Entry Form:', branch);
  // Form fields
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [location, setLocation] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [wheels, setWheels] = useState('');
  const [cft, setCft] = useState('');
  const [remark, setRemark] = useState('');
  const [trip, setTrip] = useState<'1st' | '2nd'>('1st');

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!carNumber.trim()) newErrors.carNumber = 'Car number is required';
    if (!wheels) newErrors.wheels = 'Select wheels count';

    // Only required for 1st trip
    if (trip === '1st') {
      if (!name.trim()) newErrors.name = 'Name is required';
      if (!location.trim()) newErrors.location = 'Location is required';
      if (!cft || parseFloat(cft) <= 0) newErrors.cft = 'Valid CFT required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate current slNo based on today's entries
  const getCurrentSlNo = () => {
    const today = new Date().toISOString().split('T')[0];
    const branchId = currentUser?.branchId || '';
    return getNextSlNo(today, branchId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const now = new Date();
    const dateTime = now.toISOString();
    const slNo = getCurrentSlNo();

    addEntry({
      dateTime,
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      vendor: '',
      location: location.trim(),
      carNumber: carNumber.trim(),
      wheels: parseFloat(wheels),
      cft: parseFloat(cft) || 0,
      cost: 0,
      cash: 0,
      upi: 0,
      remark: remark.trim(),
      trip,
      policeStations: trip === '2nd' ? [] : undefined,
    });

    generateGhatSlipPDF(
      {
        slNo,
        dateTime,
        carNumber,
        name,
        phoneNumber,
        location,
        wheels: Number(wheels),
        cft: Number(cft) || 0,
        cost: 0,
        cash: 0,
        upi: 0,
        remark,
        branch: branch ? branch.name : 'Main Branch',
      },
      2 // PRINT 2 COPIES
    );

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);

    // Reset form
    setName('');
    setPhoneNumber('');
    setLocation('');
    setCarNumber('');
    setWheels('');
    setCft('');
    setRemark('');
    setTrip('1st');
    setErrors({});
    setIsSubmitting(false);
    setFormKey((prev) => prev + 1); // Force re-render to update slNo

    toast({
      title: 'Success!',
      description: 'Data saved successfully',
    });
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const slNo = getCurrentSlNo();

  return (
    <Layout>
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Data Entry</h1>
              <p className="text-sm text-muted-foreground">{currentDate}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          key={formKey}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          {/* Auto-generated info */}
          <div className="mb-6 flex items-center gap-4 rounded-xl bg-secondary/50 p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Serial No</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">{slNo}</span>
              </div>
            </div>
            <div className="text-4xl font-bold text-muted-foreground/20">#</div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Trip selector */}
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Trip</label>
              <div className="flex gap-2">
                {(['1st', '2nd'] as const).map((t) => (
                  <motion.button
                    key={t}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setTrip(t)}
                    className={cn(
                      'flex-1 rounded-xl border py-3 text-sm font-medium transition-all',
                      trip === t
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/50 bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
                    )}
                  >
                    {t} Trip
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Car Number & Phone Number */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FloatingInput
                label="Car Number"
                value={carNumber}
                onChange={(e) => setCarNumber(e.target.value)}
                error={errors.carNumber}
                className='uppercase'
              />
              <FloatingInput
                label="Phone Number"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                error={errors.phoneNumber}
              />
            </div>

            {/* Name & Location */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FloatingInput
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
              />
              <FloatingInput
                label="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                error={errors.location}
              />
            </div>

            {/* Wheels & CFT */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Select value={wheels} onValueChange={setWheels}>
                  <SelectTrigger className={cn(
                    "h-12 rounded-xl border-border/50 bg-secondary/30",
                    errors.wheels && "border-destructive"
                  )}>
                    <SelectValue placeholder="Select wheels" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    {wheelsOptions.map((w) => (
                      <SelectItem key={w} value={w}>
                        {w} Wheels
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.wheels && (
                  <p className="mt-1 text-xs text-destructive">{errors.wheels}</p>
                )}
              </div>
              <FloatingInput
                label="CFT"
                type="number"
                value={cft}
                onChange={(e) => setCft(e.target.value)}
                error={errors.cft}
              />
            </div>

            {/* Remark */}
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Remark</label>
              <Textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Enter remark..."
                className="min-h-[100px] resize-none rounded-xl border-border/50 bg-secondary/30"
              />
            </div>

            {/* Submit button */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full gap-2 rounded-xl py-6 text-base font-medium"
              >
                <AnimatePresence mode="wait">
                  {isSubmitting ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Saving...
                    </motion.div>
                  ) : showSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-success"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      Saved!
                    </motion.div>
                  ) : (
                    <motion.div
                      key="default"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-5 w-5" />
                      Save Entry
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Form;
