package com.vetclinic.petowner.data.remote

import com.vetclinic.petowner.data.model.*
import retrofit2.http.*

interface ApiService {

    @POST("backend/api/auth.php")
    suspend fun login(@Body body: Map<String, String>): LoginResponse

    @POST("backend/api/auth.php")
    suspend fun logout(@Body body: Map<String, String> = mapOf("action" to "logout")): Map<String, Any>

    @GET("backend/api/pets.php")
    suspend fun getPets(): List<Pet>

    @POST("backend/api/pets.php")
    suspend fun addPet(@Body body: Map<String, @JvmSuppressWildcards Any?>): Pet

    @GET("backend/api/appointments.php")
    suspend fun getAppointments(): List<Appointment>

    @POST("backend/api/appointments.php")
    suspend fun bookAppointment(@Body body: Map<String, @JvmSuppressWildcards Any?>): Appointment

    @GET("backend/api/health_records.php")
    suspend fun getHealthRecords(@Query("pet_id") petId: Int): List<HealthRecord>

    @GET("backend/api/vaccinations.php")
    suspend fun getVaccinations(@Query("pet_id") petId: Int): List<VaccinationRecord>

    @GET("backend/api/invoices.php")
    suspend fun getInvoices(): List<Invoice>

    // New lightweight endpoint — see backend_addon/vets.php in the project root
    // for the PHP file that needs to be added to backend/api/.
    @GET("backend/api/vets.php")
    suspend fun getVeterinarians(): List<Veterinarian>
}
