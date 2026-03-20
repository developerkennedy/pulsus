# Database Structure

This directory contains all database-related code using Drizzle ORM.

## Schema

- **Users** - Clinics/Users of the system (admin, receptionist, doctor roles)
- **Specialities** - Medical specialties (Cardiologia, Pediatria, etc)
- **Doctors** - Doctors with speciality and clinic association
- **Patients** - Patients registered in the system
- **Appointments** - Doctor appointments booked with patients

## Relationships

```
Users (1) ──────────────── (Many) Doctors
Users (1) ──────────────── (Many) Patients
Users (1) ──────────────── (Many) Appointments

Specialities (1) ──────────────── (Many) Doctors

Doctors (1) ──────────────── (Many) Appointments
Patients (1) ──────────────── (Many) Appointments
```

## Usage

### Import Database

```typescript
import { db } from '@/lib/db';
```

### Import Queries

```typescript
import { getDoctorById, getAllDoctors } from '@/lib/db/queries/doctors';
import { getPatientById, getAllPatients } from '@/lib/db/queries/patients';
import { getAppointmentsByClinic } from '@/lib/db/queries/appointments';
import { getAllSpecialities } from '@/lib/db/queries/specialities';
import { getUserByEmail } from '@/lib/db/queries/users';
```

### Create a Record

```typescript
import { createDoctor } from '@/lib/db/queries/doctors';

const newDoctor = await createDoctor({
  userId: 1,
  specialityId: 2,
  license: 'ABC123',
  phone: '11999999999',
  consultationFee: 25000, // R$ 250.00
  availableDaysOfWeek: '1,2,3,4,5',
  startTime: '08:00',
  endTime: '17:00',
});
```

### Update a Record

```typescript
import { updateDoctor } from '@/lib/db/queries/doctors';

const updated = await updateDoctor(1, {
  consultationFee: 30000,
  phone: '11988888888',
});
```

### Delete/Soft Delete

```typescript
import { deleteDoctor } from '@/lib/db/queries/doctors';

// Soft delete (sets isActive to false)
const deleted = await deleteDoctor(1);
```

## Migrations

🚧 To run migrations:

```bash
npm run db:push   # Push schema to database
npm run db:migrate  # Generate migrations
npm run db:studio  # Open Drizzle Studio GUI
```

## Type Safety

All queries return TypeScript types inferred from the schema:

```typescript
import type { Doctor, NewDoctor } from '@/lib/db/schema';

const doctor: Doctor = await getDoctorById(1);
const newDoctor: NewDoctor = { ... };
```
