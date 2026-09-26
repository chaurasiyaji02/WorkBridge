package com.workbridge.api.modules.profile.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderSearchCriteria {

    private String skill;
    private BigDecimal minRate;
    private BigDecimal maxRate;
    private String location;
}