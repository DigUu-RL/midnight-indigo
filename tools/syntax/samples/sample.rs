use std::collections::HashMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Role {
    Owner,
    Editor,
    Viewer,
}

#[derive(Debug, Clone)]
pub struct Member {
    pub id: String,
    pub email: String,
    pub role: Role,
}

#[derive(Debug, thiserror::Error)]
pub enum PromoteError {
    #[error("no member {0}")]
    NotFound(String),
}

impl Member {
    /// Raises the member's role, leaving owners untouched.
    pub fn promote(&mut self, to: Role) -> &Self {
        match (self.role, to) {
            (Role::Owner, r) if r != Role::Owner => self,
            _ => {
                self.role = to;
                self
            }
        }
    }
}

pub fn promote(cache: &mut HashMap<String, Member>, id: &str) -> Result<Member, PromoteError> {
    let member = cache
        .get_mut(id)
        .ok_or_else(|| PromoteError::NotFound(id.into()))?;
    Ok(member.promote(Role::Editor).clone())
}
