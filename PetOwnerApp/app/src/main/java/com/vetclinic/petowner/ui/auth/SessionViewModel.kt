package com.vetclinic.petowner.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vetclinic.petowner.data.repository.PetOwnerRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class SessionUiState(
    val isLoading: Boolean = false,
    val isLoggedIn: Boolean = false,
    val ownerName: String? = null,
    val ownerEmail: String? = null,
    val error: String? = null
)

class SessionViewModel(
    private val repo: PetOwnerRepository = PetOwnerRepository()
) : ViewModel() {

    private val _state = MutableStateFlow(SessionUiState())
    val state: StateFlow<SessionUiState> = _state

    fun login(username: String, password: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            repo.login(username, password)
                .onSuccess { resp ->
                    if (resp.success && resp.role == "PetOwner") {
                        _state.value = _state.value.copy(
                            isLoading = false,
                            isLoggedIn = true,
                            ownerEmail = resp.email
                        )
                    } else if (resp.success) {
                        _state.value = _state.value.copy(
                            isLoading = false,
                            error = "This app is for Pet Owner accounts only."
                        )
                    } else {
                        _state.value = _state.value.copy(isLoading = false, error = "Invalid credentials")
                    }
                }
                .onFailure {
                    _state.value = _state.value.copy(isLoading = false, error = it.message ?: "Login failed")
                }
        }
    }

    fun logout() {
        viewModelScope.launch {
            repo.logout()
            _state.value = SessionUiState()
        }
    }
}
