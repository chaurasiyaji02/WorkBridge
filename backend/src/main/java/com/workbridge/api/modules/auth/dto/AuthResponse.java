package com.workbridge.api.modules.auth.dto;

import com.workbridge.api.modules.auth.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String token;
    
    @Builder.Default
    private String type = "Bearer";

    private Long id;
    private String fullName;
    private String email;
    private Role role;
}