package com.vetclinic.petowner.data.model

// Mirrors schema.sql exactly so JSON from the existing PHP backend maps 1:1.

enum class Sex { Male, Female, Unknown }
enum class AppointmentStatus { scheduled, completed, cancelled }
enum class PaymentStatus { pending, paid, overdue, refunded }

data class Veterinarian(
    val vetId: Int,
    val fullName: String,
    val address: String? = null
)

data class Pet(
    val petId: Int,
    val ownerId: Int,
    val petName: String,
    val species: String,
    val breed: String? = null,
    val dateOfBirth: String? = null, // ISO yyyy-MM-dd
    val sex: Sex = Sex.Unknown,
    val weight: Double? = null,
    val microchipNumber: String? = null,
    val knownAllergies: String? = null
)

data class Appointment(
    val appointmentId: Int,
    val vetId: Int?,            // nullable — FK is ON DELETE SET NULL in schema
    val petId: Int,
    val scheduledDate: String,   // ISO datetime
    val type: String,
    val status: AppointmentStatus,
    val resone: String? = null,  // kept as-is to match existing backend field name
    val fee: Double? = null
)

data class HealthRecord(
    val recordId: Int,
    val petId: Int,
    val vetId: Int?,
    val appointmentId: Int? = null,
    val visitDate: String,
    val clinicalFinding: String? = null,
    val diagnosisCode: String? = null,
    val treatmentPlan: String? = null,
    val labResults: String? = null
)

data class VaccinationRecord(
    val vaccineRecordId: Int,
    val petId: Int,
    val adminsteredVetId: Int?, // matches DB column spelling
    val vaccineName: String,
    val date: String,
    val nextDueDate: String? = null,
    val reactionNoted: String? = null
)

data class Invoice(
    val invoiceId: Int,
    val appointmentId: Int,
    val totalAmount: Double,
    val paymentStatus: PaymentStatus,
    val paymentMethod: String? = null,
    val issueDate: String
)

// Unified feed for the Medical Timeline screen — merges 3 tables into one
// chronological list.
enum class TimelineKind { Appointment, HealthRecord, Vaccination }

data class TimelineEntry(
    val id: String,
    val kind: TimelineKind,
    val petId: Int,
    val date: String,
    val title: String,
    val subtitle: String? = null,
    val vetName: String? = null
)

data class LoginResponse(
    val success: Boolean,
    val role: String,
    val user_id: Int,
    val email: String
)
