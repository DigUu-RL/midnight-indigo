#Requires -Version 7.0
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string] $Workspace,
    [ValidateSet('Owner', 'Editor', 'Viewer')][string] $Role = 'Editor',
    [switch] $WhatIf
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-Member {
    <#
        .SYNOPSIS
        Reads the member roster for a workspace.
    #>
    [OutputType([pscustomobject])]
    param([string] $Path)

    Get-Content -Path $Path -Raw | ConvertFrom-Json | ForEach-Object {
        [pscustomobject]@{
            Id    = $_.id
            Email = $_.email
            Role  = $_.role ?? 'Viewer'
        }
    }
}

$roster = Get-Member -Path "$Workspace/members.json"
$targets = $roster | Where-Object { $_.Role -ne 'Owner' }

foreach ($member in $targets) {
    Write-Verbose "Promoting $($member.Email) to $Role"
    if (-not $WhatIf) { Set-MemberRole -Id $member.Id -Role $Role }
}
