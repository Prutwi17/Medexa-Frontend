import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileCheck2, MapPin, Plus, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { AlertBanner, Badge, Button, Card, Input, PageLoader, Select } from '@/components/ui';
import { useNotifications } from '@/components/ui/NotificationContext';
import { deliveryApi } from '@/features/delivery/deliveryApi';
import { normalizeApiError } from '@/lib/errorHandler';
import type { VehicleType } from '@/types/delivery';

export function RiderProfilePage() {
  const queryClient = useQueryClient();
  const { notify } = useNotifications();

  const profileQuery = useQuery({
    queryKey: ['rider', 'profile'],
    queryFn: deliveryApi.getRiderProfile,
  });

  const [phoneNumber, setPhoneNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('MOTORCYCLE');
  const [vehicleRegistrationNumber, setVehicleRegistrationNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [serviceCity, setServiceCity] = useState('');
  const [identityDocumentType, setIdentityDocumentType] = useState('AADHAAR');
  const [identityDocumentNumber, setIdentityDocumentNumber] = useState('');
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState('');
  const [drivingLicenseExpiry, setDrivingLicenseExpiry] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  const [zoneName, setZoneName] = useState('');
  const [zoneCity, setZoneCity] = useState('');
  const [zonePostal, setZonePostal] = useState('');

  useEffect(() => {
    const p = profileQuery.data;
    if (!p) return;
    setPhoneNumber(p.phoneNumber);
    setVehicleType(p.vehicleType);
    setVehicleRegistrationNumber(p.vehicleRegistrationNumber);
    setVehicleModel(p.vehicleModel || '');
    setServiceCity(p.serviceCity);
    setIdentityDocumentType(p.identityDocumentType || 'AADHAAR');
    setIdentityDocumentNumber(p.identityDocumentNumber || '');
    setDrivingLicenseNumber(p.drivingLicenseNumber);
    setDrivingLicenseExpiry(p.drivingLicenseExpiry || '');
    setLat(p.currentLatitude != null ? String(p.currentLatitude) : '');
    setLng(p.currentLongitude != null ? String(p.currentLongitude) : '');
    setZoneCity(p.serviceCity);
  }, [profileQuery.data]);

  const updateProfileMutation = useMutation({
    mutationFn: () =>
      deliveryApi.updateRiderProfile({
        phoneNumber: phoneNumber.trim(),
        vehicleType,
        vehicleRegistrationNumber: vehicleRegistrationNumber.trim(),
        vehicleModel: vehicleModel.trim() || undefined,
        serviceCity: serviceCity.trim(),
        identityDocumentType: identityDocumentType.trim(),
        identityDocumentNumber: identityDocumentNumber.trim() || undefined,
        drivingLicenseNumber: drivingLicenseNumber.trim(),
        drivingLicenseExpiry: drivingLicenseExpiry || undefined,
        currentLatitude: lat ? Number(lat) : undefined,
        currentLongitude: lng ? Number(lng) : undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rider', 'profile'] });
      notify({ variant: 'success', title: 'Rider Profile Saved', message: 'Vehicle & KYC details updated.' });
    },
    onError: (err) => notify({ variant: 'error', title: 'Save Failed', message: normalizeApiError(err).message }),
  });

  const uploadDocMutation = useMutation({
    mutationFn: (vars: { docType: 'IDENTITY' | 'DRIVING_LICENSE'; file: File }) =>
      deliveryApi.uploadRiderDocument(vars.docType, vars.file),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['rider', 'profile'] });
      notify({ variant: 'success', title: 'Document Uploaded', message: `${vars.docType} document saved securely.` });
    },
    onError: (err) => notify({ variant: 'error', title: 'Upload Failed', message: normalizeApiError(err).message }),
  });

  const addZoneMutation = useMutation({
    mutationFn: () =>
      deliveryApi.addRiderZone({
        zoneName: zoneName.trim(),
        city: zoneCity.trim(),
        postalCode: zonePostal.trim(),
        active: true,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rider', 'profile'] });
      setZoneName('');
      setZonePostal('');
      notify({ variant: 'success', title: 'Zone Added', message: 'You can now receive dispatches in this postal zone.' });
    },
    onError: (err) => notify({ variant: 'error', title: 'Zone Error', message: normalizeApiError(err).message }),
  });

  const toggleZoneMutation = useMutation({
    mutationFn: (vars: { id: number; active: boolean }) => deliveryApi.toggleRiderZone(vars.id, vars.active),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['rider', 'profile'] }),
  });

  const deleteZoneMutation = useMutation({
    mutationFn: (id: number) => deliveryApi.deleteRiderZone(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['rider', 'profile'] }),
  });

  const viewOwnDoc = async (docType: 'IDENTITY' | 'DRIVING_LICENSE') => {
    try {
      const blob = await deliveryApi.fetchRiderOwnDocumentBlob(docType);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      notify({ variant: 'error', title: 'Cannot View Document', message: normalizeApiError(err).message });
    }
  };

  if (profileQuery.isLoading) {
    return <PageLoader message="Loading rider KYC, vehicle details, and delivery zones..." />;
  }

  const profile = profileQuery.data;
  if (!profile) {
    return <AlertBanner variant="error" title="Rider profile unavailable" />;
  }

  const handleSaveProfile = (e: FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate();
  };

  const handleAddZone = (e: FormEvent) => {
    e.preventDefault();
    addZoneMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-ink-primary">Rider Profile, KYC &amp; Zones</h1>
          <Badge variant={profile.verificationStatus === 'APPROVED' ? 'success' : 'warning'}>
            {profile.verificationStatus}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-ink-secondary">
          Manage your vehicle credentials, driving licence, identity KYC files, coordinates, and active postal delivery zones.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7 space-y-4">
          <h2 className="text-base font-bold text-ink-primary flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand-700" aria-hidden="true" />
            <span>Vehicle &amp; Licence Details</span>
          </h2>
          <form onSubmit={handleSaveProfile} className="grid gap-4 sm:grid-cols-2">
            <Input label="Contact Phone" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
            <Input label="Service City" required value={serviceCity} onChange={(e) => setServiceCity(e.target.value)} />

            <Select
              label="Vehicle Type"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value as VehicleType)}
              options={[
                { value: 'BICYCLE', label: 'Bicycle' },
                { value: 'SCOOTER', label: 'Scooter' },
                { value: 'MOTORCYCLE', label: 'Motorcycle' },
                { value: 'CAR', label: 'Car' },
              ]}
            />
            <Input
              label="Vehicle Registration #"
              required
              value={vehicleRegistrationNumber}
              onChange={(e) => setVehicleRegistrationNumber(e.target.value.toUpperCase())}
            />
            <Input
              label="Vehicle Model"
              value={vehicleModel}
              onChange={(e) => setVehicleModel(e.target.value)}
              placeholder="e.g. Honda Activa 6G"
            />
            <Input
              label="Driving Licence #"
              required
              value={drivingLicenseNumber}
              onChange={(e) => setDrivingLicenseNumber(e.target.value.toUpperCase())}
            />
            <Input
              label="Driving Licence Expiry"
              type="date"
              value={drivingLicenseExpiry}
              onChange={(e) => setDrivingLicenseExpiry(e.target.value)}
            />
            <Select
              label="Identity Document Type"
              value={identityDocumentType}
              onChange={(e) => setIdentityDocumentType(e.target.value)}
              options={[
                { value: 'AADHAAR', label: 'Aadhaar ID' },
                { value: 'PAN', label: 'PAN Card' },
                { value: 'PASSPORT', label: 'Passport' },
                { value: 'VOTER_ID', label: 'Voter ID' },
              ]}
            />
            <Input
              label="Identity Number"
              value={identityDocumentNumber}
              onChange={(e) => setIdentityDocumentNumber(e.target.value)}
              placeholder="Masked / Reference ID"
            />
            <Input
              label="Current Latitude (optional GPS)"
              type="number"
              step="0.000001"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="12.971600"
            />
            <Input
              label="Current Longitude (optional GPS)"
              type="number"
              step="0.000001"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="77.594600"
            />
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" loading={updateProfileMutation.isPending}>
                Save Profile &amp; Coordinates
              </Button>
            </div>
          </form>
        </Card>

        <div className="lg:col-span-5 space-y-4">
          <Card className="space-y-4">
            <h2 className="text-base font-bold text-ink-primary flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-brand-700" aria-hidden="true" />
              <span>KYC &amp; Licence Documents</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="rounded-[var(--medexa-radius-sm)] border border-border-subtle p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink-primary">Driving Licence Proof</span>
                  <Badge variant={profile.hasDrivingLicenseDocument ? 'success' : 'warning'}>
                    {profile.hasDrivingLicenseDocument ? 'Uploaded' : 'Missing'}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--medexa-radius-sm)] bg-brand-50 px-3 py-1.5 font-semibold text-brand-800 hover:bg-brand-100">
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadDocMutation.mutate({ docType: 'DRIVING_LICENSE', file });
                      }}
                    />
                  </label>
                  {profile.hasDrivingLicenseDocument && (
                    <Button type="button" size="sm" variant="outline" onClick={() => void viewOwnDoc('DRIVING_LICENSE')}>
                      View Uploaded DL
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-[var(--medexa-radius-sm)] border border-border-subtle p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink-primary">Identity Proof ({profile.identityDocumentType || 'ID'})</span>
                  <Badge variant={profile.hasIdentityDocument ? 'success' : 'warning'}>
                    {profile.hasIdentityDocument ? 'Uploaded' : 'Missing'}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--medexa-radius-sm)] bg-brand-50 px-3 py-1.5 font-semibold text-brand-800 hover:bg-brand-100">
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Upload ID File</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadDocMutation.mutate({ docType: 'IDENTITY', file });
                      }}
                    />
                  </label>
                  {profile.hasIdentityDocument && (
                    <Button type="button" size="sm" variant="outline" onClick={() => void viewOwnDoc('IDENTITY')}>
                      View Uploaded ID
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-base font-bold text-ink-primary flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-700" aria-hidden="true" />
              <span>Serviceable Delivery Zones ({profile.deliveryZones.length})</span>
            </h2>

            <form onSubmit={handleAddZone} className="grid gap-2 sm:grid-cols-3">
              <Input
                label="Zone Name"
                required
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder="Indiranagar"
              />
              <Input
                label="City"
                required
                value={zoneCity}
                onChange={(e) => setZoneCity(e.target.value)}
                placeholder="Bengaluru"
              />
              <Input
                label="Postal Code"
                required
                value={zonePostal}
                onChange={(e) => setZonePostal(e.target.value)}
                placeholder="560038"
              />
              <div className="sm:col-span-3 flex justify-end">
                <Button type="submit" size="sm" loading={addZoneMutation.isPending} leftIcon={<Plus className="h-3.5 w-3.5" />}>
                  Add Delivery Zone
                </Button>
              </div>
            </form>

            <div className="divide-y divide-border-subtle text-xs">
              {profile.deliveryZones.map((zone) => (
                <div key={zone.id} className="py-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink-primary">
                      {zone.zoneName} ({zone.postalCode})
                    </p>
                    <p className="text-ink-muted">{zone.city}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={zone.active ? 'outline' : 'ghost'}
                      onClick={() => toggleZoneMutation.mutate({ id: zone.id, active: !zone.active })}
                    >
                      {zone.active ? 'Active' : 'Paused'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteZoneMutation.mutate(zone.id)}
                      aria-label={`Remove ${zone.zoneName}`}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-[#b42318]" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
