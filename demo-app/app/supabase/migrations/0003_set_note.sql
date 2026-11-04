-- Заметка к подходу: необязательная, не длиннее 200 знаков (например, «узкий хват» или «последний повтор с помощью»).
alter table sets add column note text check (char_length(note) <= 200);
