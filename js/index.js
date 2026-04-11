let selectedRole = 'scorer';
      let currentTab = 'join';

      function setTab(tab) {
        currentTab = tab;
        document.getElementById('tab-join').className = tab === 'join' ? 'tab active' : 'tab';
        document.getElementById('tab-create').className = tab === 'create' ? 'tab active' : 'tab';
        document.getElementById('tab-import').className = tab === 'import' ? 'tab active' : 'tab';
        document.getElementById('section-join').style.display = tab === 'join' ? 'block' : 'none';
        document.getElementById('section-create').style.display = tab === 'create' ? 'block' : 'none';
        document.getElementById('section-import').style.display = tab === 'import' ? 'block' : 'none';
      }

      function selectRole(role) {
        selectedRole = role;
        document.getElementById('btn-scorer-join').className = role === 'scorer' ? 'role-btn selected' : 'role-btn';
        document.getElementById('btn-admin-join').className = role === 'admin' ? 'role-btn selected' : 'role-btn';
      }

      function showError(msg) {
        const el = document.getElementById('status-msg');
        el.textContent = msg;
        el.style.display = 'block';
        setTimeout(() => el.style.display = 'none', 4000);
      }

      function togglePassword(id) {
        const input = document.getElementById(id);
        const icon = input.nextElementSibling.querySelector('i');
        if (input.type === "password") {
          input.type = "text";
          if (icon) { icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
        } else {
          input.type = "password";
          if (icon) { icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
        }
      }

      async function copyToClipboard(id) {
        const input = document.getElementById(id);
        try {
          await navigator.clipboard.writeText(input.value);
          const btn = input.nextElementSibling;
          const orig = btn.textContent;
          btn.textContent = '完了';
          setTimeout(() => btn.textContent = orig, 1500);
        } catch (err) {
          showError('コピーに失敗しました');
        }
      }

      async function joinProject() {
        const pid = document.getElementById('join-id').value.trim();
        const pwd = document.getElementById('join-password').value;
        const name = document.getElementById('join-name').value.trim();

        if (!pid || !pwd || !name) {
          showError('全ての項目を入力してください');
          return;
        }

        const snap = await db.ref('projects/' + pid + '/settings').get();
        if (!snap.exists()) {
          showError('指定されたプロジェクトIDが見つかりません');
          return;
        }

        const settings = snap.val();
        const pwdHash = await hashPassword(pwd);
        // 旧平文パスワードとの後方互換性を維持
        if (settings.passwordHash ? settings.passwordHash !== pwdHash : settings.password !== pwd) {
          showError('パスワードが間違っています');
          return;
        }

        // ログイン成功
        session.set('projectId', pid);
        session.set('scorer_name', name);
        session.set('scorer_role', selectedRole);
        location.href = selectedRole === 'admin' ? 'judge.html' : 'judge.html';
      }

      async function createProject() {
        const pName = document.getElementById('create-project-name').value.trim();
        const pwd = document.getElementById('create-password').value;
        const name = document.getElementById('create-name').value.trim();

        if (!pName || !pwd || !name) {
          showError('全ての項目を入力してください');
          return;
        }

        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/.test(pwd)) {
          showError('パスワードは英大文字、英小文字、数字をそれぞれ1つ以上含む8文字以上である必要があります');
          return;
        }

        // ランダムなIDを生成
        const pid = Math.random().toString(36).substring(2, 10).toLowerCase();

        const pwdHash = await hashPassword(pwd);
        await db.ref('projects/' + pid + '/settings').set({
          projectName: pName,
          passwordHash: pwdHash,
          createdAt: firebase.database.ServerValue.TIMESTAMP,
          adminCreator: name
        });

        session.set('projectId', pid);
        session.set('scorer_name', name);
        session.set('scorer_role', 'admin');

        // タブを消して成功画面を表示
        document.querySelector('.tabs').style.display = 'none';
        document.getElementById('section-create').style.display = 'none';
        document.getElementById('section-success').style.display = 'block';
        document.getElementById('success-id').value = pid;
        document.getElementById('success-pwd').value = pwd;
      }

      async function importProject() {
        const file = document.getElementById('import-file').files[0];
        const pName = document.getElementById('import-project-name').value.trim();
        const pwd = document.getElementById('import-password').value;
        const name = document.getElementById('import-name').value.trim();
        const btn = document.getElementById('import-btn');

        if (!file || !pName || !pwd || !name) {
          showError('全ての項目を入力・選択してください');
          return;
        }

        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/.test(pwd)) {
          showError('パスワードは英大文字、英小文字、数字をそれぞれ1つ以上含む8文字以上である必要があります');
          return;
        }

        try {
            btn.disabled = true;
            btn.textContent = '復元中...';
            
            const text = await file.text();
            const data = JSON.parse(text);
            
            const pid = Math.random().toString(36).substring(2, 10).toLowerCase();
            const pwdHash = await hashPassword(pwd);

            if (!data.settings) data.settings = {};
            data.settings.projectName = pName;
            data.settings.passwordHash = pwdHash;
            data.settings.password = null; // Clear any old plain text password
            data.settings.createdAt = firebase.database.ServerValue.TIMESTAMP;
            data.settings.adminCreator = name;

            await db.ref('projects/' + pid).set(data);

            session.set('projectId', pid);
            session.set('scorer_name', name);
            session.set('scorer_role', 'admin');

            document.querySelector('.tabs').style.display = 'none';
            document.getElementById('section-import').style.display = 'none';
            document.getElementById('section-success').style.display = 'block';
            document.getElementById('success-id').value = pid;
            document.getElementById('success-pwd').value = pwd;

        } catch (e) {
            showError('インポートに失敗しました: ' + e.message);
            btn.disabled = false;
            btn.textContent = 'バックアップを復元して新設';
        }
      }

      // エンターキー対応（IME変換確定のEnterを確実に無視）
      let composing = false;
      document.addEventListener('compositionstart', () => { composing = true; });
      document.addEventListener('compositionend', () => {
        // compositionend後もEnterのkeyupが来るので、少し遅らせてフラグを解除
        setTimeout(() => { composing = false; }, 500);
      });
      document.addEventListener('keyup', (e) => {
        if (e.key === 'Enter' && !composing) {
          if (currentTab === 'join') {
            joinProject();
          } else {
            createProject();
          }
        }
      });