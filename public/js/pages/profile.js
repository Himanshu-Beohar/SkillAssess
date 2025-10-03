// profilePage.js - Final version with extended profile fields + change password section



const profilePage = {
  async load() {
    console.log('👤 [PROFILE] Loading profile page...');
    
    let user = auth.getCurrentUser();
    console.log('👤 [PROFILE] Initial user from storage:', user);

    if (!user) {
      console.log('👤 [PROFILE] No user in storage, redirecting to login');
      router.navigateTo(config.ROUTES.LOGIN);
      return;
    }

    // ✅ ALWAYS fetch fresh data from server when loading profile page
    try {
      console.log('👤 [PROFILE] Fetching fresh user data from server...');
      const token = localStorage.getItem(config.STORAGE_KEYS.AUTH_TOKEN);
      
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('👤 [PROFILE] Fresh user data from server:', data);
      
      if (data.success && data.data.user) {
        // Update local storage with fresh data
        localStorage.setItem(config.STORAGE_KEYS.USER_DATA, JSON.stringify(data.data.user));
        user = data.data.user;
        console.log('👤 [PROFILE] Using fresh user data:', user);
      } else {
        console.warn('👤 [PROFILE] Failed to fetch fresh data, using cached data');
      }
    } catch (error) {
      console.error('👤 [PROFILE] Error fetching fresh data:', error);
      // Continue with cached data - don't break the page
    }

    this.renderProfile(user);
  },

  renderProfile(user) {

    // ✅ Put this at the top of renderProfile(user), before building HTML
    console.log("🔍 Raw DOB from API:", user.dob);
    
    function normalizeDateForInput(d) {
      console.log("🔍 Raw DOB from API:", d);
      
      if (!d) return "";

      // Handle the UTC timestamp with timezone offset
      if (typeof d === 'string' && d.includes('T') && d.endsWith('Z')) {
        const date = new Date(d);
        console.log("🔍 Parsed UTC Date:", date.toISOString());
        
        // The date in the database is 1988-10-15T18:30:00.000Z 
        // which represents 1988-10-16 in IST
        // So we need to add the timezone offset back
        const timezoneOffset = date.getTimezoneOffset() * 60000; // in milliseconds
        const localDate = new Date(date.getTime() + timezoneOffset);
        
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, '0');
        const day = String(localDate.getDate()).padStart(2, '0');
        
        const result = `${year}-${month}-${day}`;
        console.log("🔍 Corrected DOB for input:", result);
        return result;
      }

      // For other formats
      const match = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
      return match ? match[0] : "";
    }

    const formattedDob = normalizeDateForInput(user.dob);

    const html = `
      <div class="page-container">
        <div class="page-header">
          <h1>Your Profile</h1>
          <p>Complete your profile to unlock personalized recommendations and analytics</p>
        </div>

        <div class="profile-content">

          <!-- 🧑‍💼 Profile Details Card -->
          <div class="profile-card">
            <h2>Personal & Career Information</h2>
            <form id="profile-form" class="profile-form">
              <div class="form-group">
                <label for="profile-name">Full Name</label>
                <input type="text" id="profile-name" class="form-control" value="${user.name || ''}">
              </div>

              <div class="form-group">
                <label for="profile-email">Email Address</label>
                <input type="email" id="profile-email" class="form-control" value="${user.email || ''}" disabled>
              </div>

              <div class="form-group">
                <label for="profile-gender">Gender</label>
                <select id="profile-gender" class="form-control">
                  <option value="">Select</option>
                  <option value="Male" ${user.gender === 'Male' ? 'selected' : ''}>Male</option>
                  <option value="Female" ${user.gender === 'Female' ? 'selected' : ''}>Female</option>
                  <option value="Other" ${user.gender === 'Other' ? 'selected' : ''}>Other</option>
                </select>
              </div>

              <div class="form-group">
                <label for="profile-phone">Phone Number</label>
                <input type="text" id="profile-phone" class="form-control" value="${user.phone || ''}">
              </div>

              <div class="form-group">
                <label for="profile-dob">Date of Birth</label>
                <input type="date" id="profile-dob" class="form-control" value="${formattedDob}">
              </div>

              <div class="form-group">
                <label for="profile-city">City</label>
                <input type="text" id="profile-city" class="form-control" value="${user.city || ''}">
              </div>

              <div class="form-group">
                <label for="profile-country">Country</label>
                <input type="text" id="profile-country" class="form-control" value="${user.country || ''}">
              </div>

              <div class="form-group">
                <label for="profile-qualification">Highest Qualification</label>
                <input type="text" id="profile-qualification" class="form-control" value="${user.qualification || ''}">
              </div>

              <div class="form-group">
                <label for="profile-college">College / Organization Name</label>
                <input type="text" id="profile-college" class="form-control" value="${user.college || ''}">
              </div>

              <div class="form-group">
                <label for="profile-occupation">Occupation</label>
                <select id="profile-occupation" class="form-control">
                  <option value="">Select</option>
                  <option value="Student" ${user.occupation === 'Student' ? 'selected' : ''}>Student</option>
                  <option value="Working Professional" ${user.occupation === 'Working Professional' ? 'selected' : ''}>Working Professional</option>
                  <option value="Other" ${user.occupation === 'Other' ? 'selected' : ''}>Other</option>
                </select>
              </div>

              <div class="form-group">
                <label for="profile-experience">Experience Level</label>
                <select id="profile-experience" class="form-control">
                  <option value="">Select</option>
                  <option value="Fresher" ${user.experience === 'Fresher' ? 'selected' : ''}>Fresher</option>
                  <option value="1-3 yrs" ${user.experience === '1-3 yrs' ? 'selected' : ''}>1-3 yrs</option>
                  <option value="3+ yrs" ${user.experience === '3+ yrs' ? 'selected' : ''}>3+ yrs</option>
                </select>
              </div>

              <div class="form-group">
                <label>Primary Skills (type and press Enter)</label>
                <div id="skills-input" class="skills-input"></div>
              </div>

              <div class="form-group">
                <label for="profile-goal">Career Goal</label>
                <textarea id="profile-goal" class="form-control" rows="3">${user.goal || ''}</textarea>
              </div>

              <button type="submit" class="btn btn-primary">Save Profile</button>
            </form>
          </div>

          <!-- 🔐 Change Password Card -->
          <div class="profile-card">
            <h2>Change Password</h2>
            <form id="password-form" class="profile-form">
              <div class="form-group">
                <label for="current-password">Current Password</label>
                <input type="password" id="current-password" class="form-control" required>
              </div>
              <div class="form-group">
                <label for="new-password">New Password</label>
                <input type="password" id="new-password" class="form-control" required>
              </div>
              <div class="form-group">
                <label for="confirm-password">Confirm New Password</label>
                <input type="password" id="confirm-password" class="form-control" required>
              </div>
              <button type="submit" class="btn btn-primary">Change Password</button>
            </form>
          </div>

        </div>
      </div>
    `;

    document.getElementById("page-content").innerHTML = html;

    this.initSkillsInput(user.skills || []);
    this.addEventListeners();
  },

  // initSkillsInput(existingSkills) {
  //   const container = document.getElementById("skills-input");
  //   const input = document.createElement("input");
  //   input.type = "text";
  //   input.placeholder = "Type a skill and press Enter...";
  //   container.appendChild(input);

  //   const renderTags = () => {
  //     container.querySelectorAll(".tag").forEach(t => t.remove());
  //     existingSkills.forEach(skill => {
  //       const tag = document.createElement("span");
  //       tag.className = "tag";
  //       tag.textContent = skill;
  //       const remove = document.createElement("span");
  //       remove.className = "remove-tag";
  //       remove.textContent = "×";
  //       remove.onclick = () => {
  //         existingSkills = existingSkills.filter(s => s !== skill);
  //         renderTags();
  //       };
  //       tag.appendChild(remove);
  //       container.insertBefore(tag, input);
  //     });
  //   };

  //   input.addEventListener("keydown", e => {
  //     if (e.key === "Enter" && input.value.trim()) {
  //       e.preventDefault();
  //       const newSkill = input.value.trim();
  //       if (!existingSkills.includes(newSkill)) {
  //         existingSkills.push(newSkill);
  //         renderTags();
  //       }
  //       input.value = "";
  //     }
  //   });

  //   renderTags();
  //   container.dataset.skills = JSON.stringify(existingSkills);
  //   container.addEventListener("skillsChanged", () => {
  //     container.dataset.skills = JSON.stringify(existingSkills);
  //   });
  // },

  initSkillsInput(existingSkills) {
    const container = document.getElementById("skills-input");
    let skills = existingSkills || [];

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Type a skill and press Enter...";
    container.appendChild(input);

    const renderTags = () => {
      container.querySelectorAll(".tag").forEach(tag => tag.remove());

      skills.forEach(skill => {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = skill;

        const remove = document.createElement("span");
        remove.className = "remove-tag";
        remove.textContent = "×";
        remove.onclick = () => {
          skills = skills.filter(s => s !== skill);
          renderTags();
        };

        tag.appendChild(remove);
        container.insertBefore(tag, input);
      });

      // ✅ Always keep the dataset updated
      container.dataset.skills = JSON.stringify(skills);
    };

    input.addEventListener("keydown", e => {
      if (e.key === "Enter" && input.value.trim()) {
        e.preventDefault();
        const newSkill = input.value.trim();
        if (!skills.includes(newSkill)) {
          skills.push(newSkill);
          renderTags();
        }
        input.value = "";
      }
    });

    // Initial render
    renderTags();
  },


  addEventListeners() {
    document
      .getElementById("profile-form")
      .addEventListener("submit", this.handleProfileUpdate.bind(this));
    document
      .getElementById("password-form")
      .addEventListener("submit", this.handlePasswordChange.bind(this));
  },

  async handleProfileUpdate(e) {
    e.preventDefault();

    const skillsData = JSON.parse(document.getElementById("skills-input").dataset.skills || "[]");
    console.log("📤 Sending skills:", skillsData);

    const profileData = {
      name: document.getElementById("profile-name").value,
      gender: document.getElementById("profile-gender").value,
      phone: document.getElementById("profile-phone").value,
      dob: document.getElementById("profile-dob").value,
      city: document.getElementById("profile-city").value,
      country: document.getElementById("profile-country").value,
      qualification: document.getElementById("profile-qualification").value,
      college: document.getElementById("profile-college").value,
      occupation: document.getElementById("profile-occupation").value,
      experience: document.getElementById("profile-experience").value,
      skills: skillsData,
      goal: document.getElementById("profile-goal").value
    };

    try {
      console.log("📤 Skills being sent:", skillsData);
      await auth.updateProfile(profileData);
      utils.showNotification("Profile updated successfully!", "success");
    } catch (error) {
      console.error("Profile update failed:", error);
      utils.showNotification("Failed to update profile", "error");
    }
  },

  async handlePasswordChange(e) {
    e.preventDefault();

    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (!currentPassword) {
      utils.showNotification("Please enter your current password", "error");
      return;
    }

    if (!utils.validatePassword(newPassword)) {
      utils.showNotification("New password must be at least 6 characters long", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      utils.showNotification("New passwords do not match", "error");
      return;
    }

    try {
      await auth.changePassword(currentPassword, newPassword);
      utils.showNotification("Password changed successfully!", "success");
      document.getElementById("password-form").reset();
    } catch (error) {
      console.error("Password change failed:", error);
      utils.showNotification("Failed to change password", "error");
    }
  }
};
