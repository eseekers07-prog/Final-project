package com.vetclinic.petowner.data.repository

import com.vetclinic.petowner.data.model.*
import com.vetclinic.petowner.data.remote.RetrofitClient

class PetOwnerRepository(
    private val api: com.vetclinic.petowner.data.remote.ApiService = RetrofitClient.api
) {
    suspend fun login(username: String, password: String): Result<LoginResponse> = runCatching {
        api.login(mapOf("action" to "login", "username" to username, "password" to password))
    }

    suspend fun logout(): Result<Unit> = runCatching {
        api.logout()
        RetrofitClient.clearSession()
    }

    suspend fun fetchPets(): Result<List<Pet>> = runCatching { api.getPets() }

    suspend fun fetchVets(): Result<List<Veterinarian>> = runCatching { api.getVeterinarians() }

    suspend fun fetchAppointments(): Result<List<Appointment>> =
        runCatching { api.getAppointments() }

    suspend fun bookAppointment(
        vetId: Int, petId: Int, scheduledDate: String, reason: String?
    ): Result<Appointment> = runCatching {
        api.bookAppointment(
            mapOf(
                "vet_id" to vetId,
                "pet_id" to petId,
                "scheduled_date" to scheduledDate,
                "type" to "Check-up",
                "resone" to reason // matches existing (misspelled) backend field
            )
        )
    }

    suspend fun addPet(
        ownerId: Int, name: String, species: String, breed: String?
    ): Result<Pet> = runCatching {
        api.addPet(
            mapOf(
                "owner_id" to ownerId,
                "pet_name" to name,
                "species" to species,
                "breed" to breed
            )
        )
    }

    /**
     * Merges health records + vaccinations into one chronological timeline —
     * mirrors the same combine-and-sort logic used by the web dashboard's
     * medical history view.
     */
    suspend fun fetchTimeline(petId: Int): Result<List<TimelineEntry>> = runCatching {
        val records = api.getHealthRecords(petId).map {
            TimelineEntry(
                id = "record-${it.recordId}",
                kind = TimelineKind.HealthRecord,
                petId = it.petId,
                date = it.visitDate,
                title = it.clinicalFinding ?: "Visit",
                subtitle = it.treatmentPlan
            )
        }
        val vaccines = api.getVaccinations(petId).map {
            TimelineEntry(
                id = "vacc-${it.vaccineRecordId}",
                kind = TimelineKind.Vaccination,
                petId = it.petId,
                date = it.date,
                title = it.vaccineName,
                subtitle = it.nextDueDate?.let { d -> "Next due: $d" }
            )
        }
        (records + vaccines).sortedByDescending { it.date }
    }
}
